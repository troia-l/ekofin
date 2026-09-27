"""
ESG Prediction Modülü — ESG Overall Skor Tahmini
XGBoost Track B modeli ile finansal/operasyonel verilerden ESG skoru tahmin eder.

Taşındı: esg_pred/api/main.py → modules/esg_prediction/predictor.py
"""

import os
import numpy as np
import pandas as pd
import joblib
import shap
from pydantic import BaseModel
from typing import Optional
from pathlib import Path

from config import MODELS_DIR


class CompanyFeatures(BaseModel):
    Revenue: float
    ProfitMargin: float
    MarketCap: float
    GrowthRate: float
    CarbonEmissions: float
    WaterUsage: float
    EnergyConsumption: float
    Industry: str
    Region: str
    Year: int
    # Optional YoY fields — if omitted, will default to 0 (no change)
    Revenue_yoy: Optional[float] = None
    CarbonEmissions_yoy: Optional[float] = None
    profit_per_marketcap: Optional[float] = None


class PredictionResponse(BaseModel):
    predicted_esg_overall: float
    confidence_note: str


class ESGPredictor:
    """XGBoost Track B ESG skor tahmin motoru."""

    def __init__(self, model_dir: Path = None):
        model_dir = model_dir or MODELS_DIR
        model_path = model_dir / "esg_model_trackB.pkl"
        features_path = model_dir / "esg_features_trackB.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"ESG model dosyası bulunamadı: {model_path}")

        self.model = joblib.load(model_path)
        self.features = joblib.load(features_path)
        self.explainer = shap.TreeExplainer(self.model)

    def predict(self, data: CompanyFeatures) -> PredictionResponse:
        # Initialise all model features to 0
        row = {f: 0.0 for f in self.features}

        # Direct numeric fields
        direct_fields = [
            "Revenue", "ProfitMargin", "MarketCap", "GrowthRate",
            "CarbonEmissions", "WaterUsage", "EnergyConsumption"
        ]
        for field in direct_fields:
            if field in row:
                row[field] = getattr(data, field)

        # One-hot encoding for Industry and Region
        industry_key = f"Industry_{data.Industry}"
        region_key = f"Region_{data.Region}"
        if industry_key in row:
            row[industry_key] = 1.0
        if region_key in row:
            row[region_key] = 1.0

        # Derived intensity features
        rev = data.Revenue + 1e-9
        row["carbon_intensity"] = data.CarbonEmissions / rev
        row["water_intensity"] = data.WaterUsage / rev
        row["energy_intensity"] = data.EnergyConsumption / rev

        # Normalised year
        row["Year_norm"] = (data.Year - 2015) / (2025 - 2015)

        # Optional YoY / ratio features
        if "Revenue_yoy" in row:
            row["Revenue_yoy"] = data.Revenue_yoy if data.Revenue_yoy is not None else 0.0
        if "CarbonEmissions_yoy" in row:
            row["CarbonEmissions_yoy"] = data.CarbonEmissions_yoy if data.CarbonEmissions_yoy is not None else 0.0
        if "profit_per_marketcap" in row:
            mc = data.MarketCap + 1e-9
            row["profit_per_marketcap"] = (
                data.profit_per_marketcap
                if data.profit_per_marketcap is not None
                else data.ProfitMargin / mc
            )

        X = pd.DataFrame([row])[self.features]
        pred = float(self.model.predict(X)[0])
        pred = np.clip(pred, 0, 100)

        return PredictionResponse(
            predicted_esg_overall=round(pred, 2),
            confidence_note=(
                "Track B model (no sub-scores). "
                "Approx. ±8.6 pt RMSE on 2024-2025 holdout. "
                "Supply Revenue_yoy and CarbonEmissions_yoy for higher accuracy."
            )
        )

    def explain(self, data: CompanyFeatures) -> dict:
        """Belirli bir şirket verisi için yerel SHAP değerlerini ve etki yüzdelerini hesaplar."""
        row = {f: 0.0 for f in self.features}

        # Predict metodundaki aynı pre-processing adımları
        direct_fields = [
            "Revenue", "ProfitMargin", "MarketCap", "GrowthRate",
            "CarbonEmissions", "WaterUsage", "EnergyConsumption"
        ]
        for field in direct_fields:
            if field in row:
                row[field] = getattr(data, field)

        industry_key = f"Industry_{data.Industry}"
        region_key = f"Region_{data.Region}"
        if industry_key in row:
            row[industry_key] = 1.0
        if region_key in row:
            row[region_key] = 1.0

        rev = data.Revenue + 1e-9
        row["carbon_intensity"] = data.CarbonEmissions / rev
        row["water_intensity"] = data.WaterUsage / rev
        row["energy_intensity"] = data.EnergyConsumption / rev
        row["Year_norm"] = (data.Year - 2015) / (2025 - 2015)

        if "Revenue_yoy" in row:
            row["Revenue_yoy"] = data.Revenue_yoy if data.Revenue_yoy is not None else 0.0
        if "CarbonEmissions_yoy" in row:
            row["CarbonEmissions_yoy"] = data.CarbonEmissions_yoy if data.CarbonEmissions_yoy is not None else 0.0
        if "profit_per_marketcap" in row:
            mc = data.MarketCap + 1e-9
            row["profit_per_marketcap"] = (
                data.profit_per_marketcap
                if data.profit_per_marketcap is not None
                else data.ProfitMargin / mc
            )

        X = pd.DataFrame([row])[self.features]
        # Extract the scalar correctly to prevent NumPy deprecation warning
        ev = self.explainer.expected_value
        base_value = float(ev[0]) if isinstance(ev, np.ndarray) else float(ev)
        shap_values = self.explainer.shap_values(X)[0]

        # En etkili ilk 10 özniteliği sırala
        contributions = []
        for feat_name, s_val in zip(self.features, shap_values):
            if abs(s_val) > 0.001:
                contributions.append({
                    "feature": feat_name,
                    "shap_value": round(float(s_val), 3),
                    "impact": "positive" if s_val > 0 else "negative"
                })
        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        
        return {
            "base_value": round(base_value, 2),
            "predicted_score": round(float(np.clip(self.model.predict(X)[0], 0, 100)), 2),
            "top_contributions": contributions[:10]
        }

