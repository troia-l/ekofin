"""Karbon hesaplama, yeşil kredi, simülatör bağlamı ve rapora bağlı g-ROI router'ı."""

import json
import subprocess
import sys
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException

from config import (
    BASE_DIR, DOCUMENT_TYPE_MAP,
    get_company_sources_dir, get_company_declaration_path,
)
from modules.carbon.extractor import extract_activities, _mock_parser, CarbonExtractionModel
from modules.carbon.roi import ROIRequest, calculate_green_credit, calculate_groi
from .common import CalculationRequest, calculator, _load_uploads_meta


router = APIRouter(tags=["Carbon & Simulator"])


# ─── Belge türü etiketleri (aggregate-context için) ──────────────────────────
DOCUMENT_TYPE_LABELS = {
    "sgk": "SGK Hizmet Dökümü",
    "ekb": "Enerji Kimlik Belgesi",
    "fatura": "Tüketim Faturaları",
    "mizan": "Kurumsal Bilanço/Mizan",
    "motat": "MOTAT Atık ve Su Beyanı",
    "osgb": "OSGB Raporu",
    "tasit": "Taşıt Tanıma Sistemi",
    "faaliyet": "Şirket Faaliyet Raporu",
    "sanayi_sicil": "Sanayi Sicil Belgesi",
    "kapasite_raporu": "Kapasite Raporu",
    "iso_14001": "ISO 14001 Sertifikası",
    "efatura": "e-Fatura",
}


def _extract_activities_isolated(text: str, timeout: int = 25) -> CarbonExtractionModel:
    """extract_activities'i (Gemini LLM çağrısı) ayrı bir Python sürecinde
    çalıştırır. Aynı çağrı FastAPI'nin senkron endpoint thread havuzu
    içinde bazen süresiz askıda kalabiliyordu; izole süreç + sert timeout
    bunu önler ve zaman aşımında hızlıca mock moda düşer."""
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "modules.carbon.extract_worker"],
            input=text, capture_output=True, text=True, timeout=timeout, cwd=str(BASE_DIR),
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return CarbonExtractionModel(**json.loads(proc.stdout.strip()))
        print(f"[Uyarı] Karbon çıkarım süreci beklenmeyen çıktı verdi: {proc.stderr[-500:] if proc.stderr else ''}")
    except subprocess.TimeoutExpired:
        print(f"[Uyarı] Karbon aktivite çıkarımı {timeout}s içinde tamamlanamadı, mock moda düşülüyor.")
    except Exception as e:
        print(f"[Uyarı] İzole karbon çıkarım süreci hata verdi: {e}")

    return _mock_parser(text)


@router.post("/api/carbon/calculate")
def calculate_carbon(req: CalculationRequest):
    """Metin gir → karbon hesabı + Yeşil Kredi Skoru al."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Girdi metni boş olamaz.")

    try:
        # Aşama 1: Yapılandırılmış aktivite çıkarımı (izole süreçte, hang koruması ile)
        extracted_data = _extract_activities_isolated(req.text)

        # Aşama 2: Deterministik karbon hesaplama
        carbon_result = calculator.process_calculation(extracted_data)

        # Aşama 3: Yeşil Kredi Skorlama
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

        # Aşama 4: G-ROI Hesaplama
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


@router.get("/api/simulator/aggregate-context")
def get_simulator_context(ticker: Optional[str] = None):
    """Yüklenen belgeler + yönetici anketinden g-ROI simülatörü için
    Model C'ye (karbon çıkarımı) beslenecek özet metni üretir."""
    company_sources_dir = get_company_sources_dir(ticker)
    declaration_path = get_company_declaration_path(ticker)
    meta = _load_uploads_meta(ticker)
    docs_meta = meta.get("documents", {})

    parts = []
    uploaded_docs = []
    seen_files = set()
    for doc_type, target_filename in DOCUMENT_TYPE_MAP.items():
        if doc_type not in docs_meta:
            continue
        if target_filename in seen_files:
            continue
        file_path = company_sources_dir / target_filename
        if not file_path.exists():
            continue
        try:
            content = file_path.read_text(encoding="utf-8").strip()
        except (UnicodeDecodeError, OSError):
            content = ""
        if not content:
            continue
        seen_files.add(target_filename)
        parts.append(f"[{DOCUMENT_TYPE_LABELS.get(doc_type, doc_type)}]\n{content}")
        uploaded_docs.append({"doc_type": doc_type, "label": DOCUMENT_TYPE_LABELS.get(doc_type, doc_type)})

    declaration_summary = None
    declaration_data = None
    if declaration_path.exists():
        with open(declaration_path, "r", encoding="utf-8") as f:
            declaration_data = json.load(f)

        sentences = []
        if declaration_data.get("employeeCount"):
            sentences.append(f"Şirkette toplam {declaration_data['employeeCount']} çalışan bulunmaktadır.")
        if declaration_data.get("annualElectricity"):
            sentences.append(f"Yıllık elektrik tüketimi {declaration_data['annualElectricity']} kWh'tir.")
        if declaration_data.get("annualNaturalGas"):
            sentences.append(f"Yıllık doğalgaz tüketimi {declaration_data['annualNaturalGas']} m³'tür.")
        if declaration_data.get("annualWater"):
            sentences.append(f"Yıllık su tüketimi {declaration_data['annualWater']} m³'tür.")
        vehicles = declaration_data.get("vehiclesCount") or {}
        vehicle_parts = [f"{count} adet {vtype}" for vtype, count in vehicles.items() if count]
        if vehicle_parts:
            sentences.append("Şirket filosunda " + ", ".join(vehicle_parts) + " bulunmaktadır.")
        if declaration_data.get("hasRenewableEnergy"):
            sentences.append("Şirket yenilenebilir enerji kaynağı kullanmaktadır.")
        if declaration_data.get("sustainabilityGoals"):
            sentences.append(f"Sürdürülebilirlik hedefleri: {declaration_data['sustainabilityGoals']}")

        if sentences:
            declaration_summary = " ".join(sentences)
            parts.append(f"[Yönetici Anketi]\n{declaration_summary}")

    return {
        "ticker": (ticker or "DEFAULT").strip().upper() or "DEFAULT",
        "has_documents": len(uploaded_docs) > 0,
        "uploaded_docs": uploaded_docs,
        "has_declaration": declaration_summary is not None,
        "declaration_summary": declaration_summary,
        "aggregated_text": "\n\n".join(parts),
    }
