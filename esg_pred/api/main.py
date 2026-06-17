from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import joblib
import numpy as np
import os

app = FastAPI(
    title="ESG Overall Score Predictor",
    version="1.0.0",
    description="Track B model — predicts ESG Overall score from financial and operational data (no sub-scores required)."
)

# CORS: allow all origins (restrict to your domain in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Resolve model paths relative to project root
_api_dir  = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_api_dir)

model_path    = os.path.join(_root_dir, "esg_model_trackB.pkl")
features_path = os.path.join(_root_dir, "esg_features_trackB.pkl")

if not os.path.exists(model_path):
    # Fallback: running uvicorn from project root
    model_path    = "esg_model_trackB.pkl"
    features_path = "esg_features_trackB.pkl"

model    = joblib.load(model_path)
features = joblib.load(features_path)


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


@app.post("/predict", response_model=PredictionResponse)
def predict_esg(data: CompanyFeatures):
    try:
        # Initialise all model features to 0
        row = {f: 0.0 for f in features}

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
        region_key   = f"Region_{data.Region}"
        if industry_key in row:
            row[industry_key] = 1.0
        if region_key in row:
            row[region_key] = 1.0

        # Derived intensity features
        rev = data.Revenue + 1e-9
        row["carbon_intensity"]  = data.CarbonEmissions / rev
        row["water_intensity"]   = data.WaterUsage      / rev
        row["energy_intensity"]  = data.EnergyConsumption / rev

        # Normalised year
        row["Year_norm"] = (data.Year - 2015) / (2025 - 2015)

        # Optional YoY / ratio features (user-supplied or default 0)
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

        X    = pd.DataFrame([row])[features]
        pred = float(model.predict(X)[0])
        pred = np.clip(pred, 0, 100)

        return PredictionResponse(
            predicted_esg_overall=round(pred, 2),
            confidence_note=(
                "Track B model (no sub-scores). "
                "Approx. ±8.6 pt RMSE on 2024-2025 holdout. "
                "Supply Revenue_yoy and CarbonEmissions_yoy for higher accuracy."
            )
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_version": "1.0.0",
        "model_file": os.path.basename(model_path),
        "n_features": len(features)
    }
