"""
EkoFin Birleşik Backend Gateway API
Tüm modülleri (Carbon, TSRS, ESG) tek bir FastAPI uygulamasında birleştirir.
Port: 8000
"""

import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from config import (
    BASE_DIR, SOURCES_DIR, REPORT_OUTPUT_PATH, DECLARATION_PATH,
    UPLOADS_META_PATH, DOCUMENT_TYPE_MAP, EKLENEN_VERILER_PATH,
    OUTPUT_DIR,
)

load_dotenv(dotenv_path=BASE_DIR / ".env")

# ─── Modül İmportları ────────────────────────────────────────────────────────
from modules.carbon.extractor import extract_activities
from modules.carbon.calculator import CarbonCalculator
from modules.carbon.roi import calculate_groi, ROIRequest, calculate_green_credit

# ESG modeli lazy-load edilecek (pkl dosyaları büyük olabilir)
_esg_predictor = None

def _get_esg_predictor():
    global _esg_predictor
    if _esg_predictor is None:
        try:
            from modules.esg_prediction.predictor import ESGPredictor
            _esg_predictor = ESGPredictor()
        except Exception as e:
            print(f"[UYARI] ESG modeli yüklenemedi: {e}")
            raise
    return _esg_predictor


# ─── FastAPI Uygulaması ──────────────────────────────────────────────────────
app = FastAPI(
    title="EkoFin Birleşik Backend",
    description="Belge yükleme, TSRS rapor üretimi, karbon hesaplama, yeşil kredi skorlama ve ESG tahmini — tek API.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

calculator = CarbonCalculator()


# ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

def _load_uploads_meta() -> dict:
    """Yüklenen belgelerin meta bilgilerini yükle."""
    if UPLOADS_META_PATH.exists():
        with open(UPLOADS_META_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"documents": {}, "uploads": []}


def _save_uploads_meta(meta: dict):
    """Meta bilgilerini kaydet."""
    UPLOADS_META_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(UPLOADS_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def _compute_file_hash(file_path: Path) -> str:
    """Dosyanın SHA-256 hash'ini hesapla."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return "0x" + sha256.hexdigest()


# ─── Request/Response Modeller ────────────────────────────────────────────────

class DeclarationData(BaseModel):
    """Yönetici Anketi / Beyan Formu verisi."""
    employeeCount: Optional[int] = None
    femaleEmployeeCount: Optional[int] = None
    maleEmployeeCount: Optional[int] = None
    extraExcuseLeave: Optional[int] = None
    vehiclesCount: Optional[dict] = None
    annualElectricity: Optional[float] = None
    annualNaturalGas: Optional[float] = None
    annualWater: Optional[float] = None
    hasEmsPolicy: Optional[str] = None
    hasRenewableEnergy: Optional[bool] = None
    sustainabilityGoals: Optional[str] = None
    climateRiskAssessment: Optional[str] = None
    scope3Exemption: Optional[bool] = None


class ReportStatus(BaseModel):
    status: str  # "idle" | "generating" | "completed" | "error"
    progress: int = 0
    message: str = ""


class CalculationRequest(BaseModel):
    text: str
    ges_budget: float = Field(default=0.0, description="GES Yatırımı (TL)")
    ev_count: int = Field(default=0, description="Elektrikli Araç Sayısı")
    eff_budget: float = Field(default=0.0, description="Enerji Verimliliği Bütçesi (TL)")
    waste_budget: float = Field(default=0.0, description="Atık Yönetimi Bütçesi (TL)")
    water_budget: float = Field(default=0.0, description="Su Verimliliği Bütçesi (TL)")
    loan_amount: float = Field(default=500_000.0, description="Talep Edilen Kredi (TL)")
    loan_years: int = Field(default=5, description="Kredi vadesi (yıl)")
    financial_rating: str = Field(default="BBB", description="Derecelendirme Notu")


# ─── Global State ────────────────────────────────────────────────────────────
_report_status: ReportStatus = ReportStatus(status="idle", progress=0, message="")


# ═══════════════════════════════════════════════════════════════════════════════
#                              ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "service": "EkoFin Birleşik Backend",
        "version": "2.0.0",
        "endpoints": [
            "GET  /api/dashboard/summary",
            "POST /api/documents/upload",
            "GET  /api/documents/list",
            "GET  /api/documents/status",
            "POST /api/declaration",
            "GET  /api/declaration",
            "POST /api/report/generate",
            "GET  /api/report/latest",
            "GET  /api/report/status",
            "POST /api/report/verify",
            "POST /api/carbon/calculate",
            "POST /api/esg/predict",
            "GET  /api/esg/health",
        ],
    }


# ── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/summary")
def dashboard_summary():
    """Dashboard için özet metrikleri döndür."""
    meta = _load_uploads_meta()
    docs = meta.get("documents", {})

    total_docs = len([d for d in docs.values() if d.get("status") == "verified"])
    declaration_exists = DECLARATION_PATH.exists()
    report_exists = REPORT_OUTPUT_PATH.exists()
    report_hash = ""
    if report_exists:
        report_hash = _compute_file_hash(REPORT_OUTPUT_PATH)

    eklenen_content = ""
    if EKLENEN_VERILER_PATH.exists():
        with open(EKLENEN_VERILER_PATH, "r", encoding="utf-8") as f:
            eklenen_content = f.read()

    return {
        "total_verified_documents": total_docs,
        "declaration_submitted": declaration_exists,
        "report_generated": report_exists,
        "report_hash": report_hash,
        "eklenen_veriler": eklenen_content,
        "last_updated": datetime.now().isoformat(),
    }


# ── Belge Yükleme ───────────────────────────────────────────────────────────

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
):
    """Belge yükle ve sources dizinine kaydet."""
    if doc_type not in DOCUMENT_TYPE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz belge türü: {doc_type}. Geçerli türler: {list(DOCUMENT_TYPE_MAP.keys())}",
        )

    target_filename = DOCUMENT_TYPE_MAP[doc_type]
    target_path = SOURCES_DIR / target_filename

    SOURCES_DIR.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    meta = _load_uploads_meta()
    meta["documents"][doc_type] = {
        "status": "verified",
        "original_filename": file.filename,
        "target_filename": target_filename,
        "uploaded_at": datetime.now().isoformat(),
        "size_bytes": len(content),
    }
    meta["uploads"].insert(0, {
        "filename": file.filename,
        "doc_type": doc_type,
        "uploaded_at": datetime.now().isoformat(),
        "status": "processed",
    })
    meta["uploads"] = meta["uploads"][:20]
    _save_uploads_meta(meta)

    return {
        "status": "success",
        "message": f"{file.filename} başarıyla yüklendi ve {target_filename} olarak kaydedildi.",
        "doc_type": doc_type,
        "target_filename": target_filename,
    }


@app.get("/api/documents/list")
def list_uploads():
    """Son yüklenen dosyaların listesini döndür."""
    meta = _load_uploads_meta()
    return {"uploads": meta.get("uploads", [])}


@app.get("/api/documents/status")
def documents_status():
    """Her belge türünün durumunu döndür."""
    meta = _load_uploads_meta()
    docs = meta.get("documents", {})

    declaration_status = "verified" if DECLARATION_PATH.exists() else "not_uploaded"

    statuses = {}
    for doc_type, target_file in DOCUMENT_TYPE_MAP.items():
        if doc_type in docs:
            statuses[doc_type] = docs[doc_type]
        else:
            if (SOURCES_DIR / target_file).exists():
                statuses[doc_type] = {
                    "status": "verified",
                    "target_filename": target_file,
                    "uploaded_at": None,
                    "note": "Dosya sistemde mevcut",
                }
            else:
                statuses[doc_type] = {"status": "not_uploaded"}

    statuses["declaration"] = {"status": declaration_status}

    return {"documents": statuses}


# ── Yönetici Anketi ──────────────────────────────────────────────────────────

@app.post("/api/declaration")
def save_declaration(data: DeclarationData):
    """Yönetici Anketi verisini JSON olarak kaydet."""
    SOURCES_DIR.mkdir(parents=True, exist_ok=True)
    payload = data.model_dump(exclude_none=True)
    payload["submitted_at"] = datetime.now().isoformat()

    with open(DECLARATION_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return {
        "status": "success",
        "message": "Yönetici beyanı kaydedildi.",
        "path": str(DECLARATION_PATH),
    }


@app.get("/api/declaration")
def get_declaration():
    """Kayıtlı yönetici anketi verisini getir."""
    if not DECLARATION_PATH.exists():
        return {"status": "not_found", "data": None}
    with open(DECLARATION_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"status": "found", "data": data}


# ── TSRS Rapor Üretimi ───────────────────────────────────────────────────────

@app.post("/api/report/generate")
def generate_report():
    """TSRS pipeline'ını doğrudan modül olarak çağırarak rapor üret."""
    global _report_status

    if _report_status.status == "generating":
        raise HTTPException(status_code=409, detail="Rapor üretimi zaten devam ediyor.")

    _report_status = ReportStatus(
        status="generating", progress=10, message="Pipeline başlatılıyor..."
    )

    try:
        from modules.tsrs.pipeline import run_tsrs_pipeline

        _report_status.progress = 20
        _report_status.message = "Pipeline çalıştırılıyor..."

        result = run_tsrs_pipeline()

        if result["status"] == "error":
            _report_status = ReportStatus(
                status="error",
                progress=0,
                message=f"Pipeline hatası: {result.get('error', 'Bilinmeyen hata')[:500]}",
            )
            raise HTTPException(
                status_code=500,
                detail=f"Pipeline hatası: {result.get('error', '')}",
            )

        _report_status = ReportStatus(
            status="completed", progress=100, message="Rapor başarıyla üretildi."
        )

        return {
            "status": "success",
            "message": "TSRS raporu başarıyla üretildi.",
            "output_path": result.get("output_path"),
            "hash": _compute_file_hash(REPORT_OUTPUT_PATH) if REPORT_OUTPUT_PATH.exists() else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        _report_status = ReportStatus(
            status="error", progress=0, message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/latest")
def get_latest_report():
    """Son üretilen TSRS raporunun içeriğini döndür."""
    if not REPORT_OUTPUT_PATH.exists():
        return {"status": "not_found", "content": None}

    with open(REPORT_OUTPUT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    return {
        "status": "found",
        "content": content,
        "hash": _compute_file_hash(REPORT_OUTPUT_PATH),
        "generated_at": datetime.fromtimestamp(
            REPORT_OUTPUT_PATH.stat().st_mtime
        ).isoformat(),
    }


@app.get("/api/report/status")
def report_status():
    """Rapor üretim durumunu döndür."""
    return _report_status.model_dump()


@app.post("/api/report/verify")
def verify_report(hash_to_verify: str = Form(...)):
    """Rapor hash'ini doğrula."""
    if not REPORT_OUTPUT_PATH.exists():
        raise HTTPException(status_code=404, detail="Rapor dosyası bulunamadı.")

    actual_hash = _compute_file_hash(REPORT_OUTPUT_PATH)
    is_valid = actual_hash == hash_to_verify

    return {
        "is_valid": is_valid,
        "actual_hash": actual_hash,
        "provided_hash": hash_to_verify,
        "verified_at": datetime.now().isoformat(),
    }


# ── Karbon Hesaplama & Yeşil Kredi (eski model_c) ───────────────────────────

@app.post("/api/carbon/calculate")
def calculate_carbon(req: CalculationRequest):
    """Metin gir → karbon hesabı + Yeşil Kredi Skoru al."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Girdi metni boş olamaz.")

    try:
        # Aşama 1: Yapılandırılmış aktivite çıkarımı
        extracted_data = extract_activities(req.text)

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
            extracted_activities=carbon_result["results"]
        )

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
                "audit_notes": credit_result.audit_notes
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sorgu işlenirken hata: {str(e)}")


# ── ESG Skor Tahmini (eski esg_pred) ────────────────────────────────────────

@app.post("/api/esg/predict")
def predict_esg(data: dict):
    """ESG Overall skorunu tahmin et."""
    try:
        from modules.esg_prediction.predictor import CompanyFeatures, ESGPredictor
        predictor = _get_esg_predictor()
        features = CompanyFeatures(**data)
        result = predictor.predict(features)
        return result.model_dump()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"ESG modeli yüklenemedi: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/esg/health")
def esg_health():
    """ESG model sağlık kontrolü."""
    try:
        predictor = _get_esg_predictor()
        return {
            "status": "ok",
            "model_version": "1.0.0",
            "n_features": len(predictor.features)
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


# ─── Çalıştırma ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
