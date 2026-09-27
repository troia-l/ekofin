"""Karbon hesaplama, yeşil kredi ve rapora bağlı g-ROI router'ı."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException

from modules.carbon.extractor import extract_activities
from modules.carbon.roi import ROIRequest, calculate_green_credit, calculate_groi
from .common import CalculationRequest, calculator


router = APIRouter(tags=["Carbon & Simulator"])


@router.post("/api/carbon/calculate")
def calculate_carbon(req: CalculationRequest):
    """Yapılandırılmış aktivite çıkarımı ve deterministik karbon hesabı."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Girdi metni boş olamaz.")

    try:
        extracted_data = extract_activities(req.text)
        carbon_result = calculator.process_calculation(extracted_data)
        credit_result = calculate_green_credit(
            total_co2_tons=carbon_result["total_co2_tons"],
            ges_budget=req.ges_budget,
            ev_count=req.ev_count,
            eff_budget=req.eff_budget,
            waste_budget=req.waste_budget,
            water_budget=req.water_budget,
            loan_amount=req.loan_amount,
            loan_years=req.loan_years,
            financial_rating=req.financial_rating,
            extracted_activities=carbon_result["results"],
        )
        roi_req = ROIRequest(
            total_co2_tons=carbon_result["total_co2_tons"],
            extracted_activities=carbon_result["results"],
            investment_tl=req.investment_tl if req.investment_tl is not None else req.loan_amount,
            loan_years=req.loan_years,
            reduction_target_pct=req.reduction_target_pct if req.reduction_target_pct is not None else 30.0,
        )
        groi_result = calculate_groi(roi_req)
        return {
            "status": "success",
            "total_co2_tons": carbon_result["total_co2_tons"],
            "audit_trail": carbon_result["audit_trail"],
            "extracted_activities": carbon_result["results"],
            "credit_score": {
                "green_credit_score": credit_result.green_credit_score,
                "financial_score": credit_result.financial_score,
                "environmental_score": credit_result.environmental_score,
                "cash_flow_score": credit_result.cash_flow_score,
                "decision": credit_result.decision,
                "discount_pct": credit_result.discount_pct,
                "total_capex": credit_result.total_capex,
                "carbon_reduction": credit_result.carbon_reduction,
                "new_emission": credit_result.new_emission,
                "annual_opex_savings": credit_result.annual_opex_savings,
                "groi_payback_years": credit_result.groi_payback_years,
                "audit_notes": credit_result.audit_notes,
            },
            "groi": groi_result.model_dump(),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Sorgu işlenirken hata: {str(exc)}") from exc


@router.get("/api/simulator/auto-context")
def get_simulator_auto_context(ticker: Optional[str] = None, reporting_year: Optional[int] = None):
    """Yalnız yayımlanmış ve güncel TSRS sürümüne ait g-ROI bağlamını döndürür."""
    from modules.tsrs.job_service import get_simulator_context, normalize_ticker

    try:
        year = reporting_year or datetime.now().year - 1
        return get_simulator_context(normalize_ticker(ticker), year)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "invalid_ticker", "message": str(exc)},
        ) from exc
