"""
EkoFin Backend Gateway API
Birleştirici FastAPI uygulaması — dosya yükleme, rapor üretimi ve dashboard özeti.
Port: 8000
"""

import os
import json
import hashlib
import subprocess
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Yol Sabitleri ────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
AIAGENT_DIR = BASE_DIR / "TSRS_Rapor" / "aiagent"
TSRS_DIR = BASE_DIR / "TSRS_Rapor"
REPORT_OUTPUT = TSRS_DIR / "TSRS_Uyumlu_Surdurulebilirlik_Raporu.md"
DECLARATION_PATH = AIAGENT_DIR / "yonetici_anketi.json"
UPLOADS_META_PATH = BASE_DIR / "backend" / "uploads_meta.json"

# Belge türü → hedef dosya adı eşlemesi
DOCUMENT_TYPE_MAP = {
    "sgk": "sgk_listesi.md",
    "ekb": "ekb.md",
    "fatura": "faturalar.md",
    "mizan": "mizan.md",
    "motat": "motat-atik-ve-su-beyani.md",
    "osgb": "osgb-raporu.md",
    "tasit": "tasit-tanima-sistemi.md",
    "faaliyet": "şirket-faliyet-raporu.md",
    "sanayi_sicil": "sanayi_sicil.json",
    "kapasite_raporu": "kapasite_raporu.json",
    "iso_14001": "iso_14001.json",
    "efatura": "faturalar.md",
}

# ─── FastAPI Uygulaması ──────────────────────────────────────────────────────
app = FastAPI(
    title="EkoFin Backend Gateway",
    description="Dosya yükleme, TSRS rapor üretimi ve dashboard özeti API'si.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# ─── Modeller ────────────────────────────────────────────────────────────────

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


# ─── Global State (basit in-memory) ─────────────────────────────────────────
_report_status: ReportStatus = ReportStatus(status="idle", progress=0, message="")


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "EkoFin Backend Gateway",
        "version": "1.0.0",
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
        ],
    }


# ── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/summary")
def dashboard_summary():
    """Dashboard için özet metrikleri döndür."""
    meta = _load_uploads_meta()
    docs = meta.get("documents", {})

    # Yüklenen belge sayısı
    total_docs = len([d for d in docs.values() if d.get("status") == "verified"])

    # Yönetici anketi var mı?
    declaration_exists = DECLARATION_PATH.exists()

    # Rapor üretilmiş mi?
    report_exists = REPORT_OUTPUT.exists()
    report_hash = ""
    if report_exists:
        report_hash = _compute_file_hash(REPORT_OUTPUT)

    # Eklenen veriler dosyasından basit metrikler çek
    eklenen_path = TSRS_DIR / "eklenen_veriler.md"
    eklenen_content = ""
    if eklenen_path.exists():
        with open(eklenen_path, "r", encoding="utf-8") as f:
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
    """Belge yükle ve aiagent dizinine kaydet."""
    if doc_type not in DOCUMENT_TYPE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz belge türü: {doc_type}. Geçerli türler: {list(DOCUMENT_TYPE_MAP.keys())}",
        )

    target_filename = DOCUMENT_TYPE_MAP[doc_type]
    target_path = AIAGENT_DIR / target_filename

    # Dosyayı kaydet
    AIAGENT_DIR.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    # Meta güncelle
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
    # Son 20 yüklemeyi tut
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

    # Yönetici anketi durumu
    declaration_status = "verified" if DECLARATION_PATH.exists() else "not_uploaded"

    statuses = {}
    for doc_type, target_file in DOCUMENT_TYPE_MAP.items():
        if doc_type in docs:
            statuses[doc_type] = docs[doc_type]
        else:
            # Dosya aiagent dizininde zaten var mı kontrol et
            if (AIAGENT_DIR / target_file).exists():
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
    AIAGENT_DIR.mkdir(parents=True, exist_ok=True)
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
    """run_pipeline.py'yi tetikleyerek TSRS raporunu üret."""
    global _report_status

    if _report_status.status == "generating":
        raise HTTPException(status_code=409, detail="Rapor üretimi zaten devam ediyor.")

    _report_status = ReportStatus(
        status="generating", progress=10, message="Pipeline başlatılıyor..."
    )

    try:
        pipeline_path = TSRS_DIR / "aiagent" / "run_pipeline.py"
        if not pipeline_path.exists():
            _report_status = ReportStatus(
                status="error", progress=0, message="run_pipeline.py bulunamadı."
            )
            raise HTTPException(status_code=404, detail="run_pipeline.py bulunamadı.")

        _report_status.progress = 20
        _report_status.message = "Pipeline çalıştırılıyor..."

        # Pipeline'ı subprocess olarak çalıştır
        result = subprocess.run(
            ["python", str(pipeline_path)],
            cwd=str(TSRS_DIR / "aiagent"),
            capture_output=True,
            text=True,
            timeout=600,  # 10 dakika timeout
        )

        if result.returncode != 0:
            _report_status = ReportStatus(
                status="error",
                progress=0,
                message=f"Pipeline hatası: {result.stderr[:500]}",
            )
            raise HTTPException(
                status_code=500,
                detail=f"Pipeline hatası: {result.stderr[:500]}",
            )

        _report_status = ReportStatus(
            status="completed", progress=100, message="Rapor başarıyla üretildi."
        )

        return {
            "status": "success",
            "message": "TSRS raporu başarıyla üretildi.",
            "output_path": str(REPORT_OUTPUT),
            "hash": _compute_file_hash(REPORT_OUTPUT) if REPORT_OUTPUT.exists() else None,
        }

    except subprocess.TimeoutExpired:
        _report_status = ReportStatus(
            status="error", progress=0, message="Pipeline zaman aşımına uğradı (10 dk)."
        )
        raise HTTPException(status_code=504, detail="Pipeline zaman aşımına uğradı.")
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
    if not REPORT_OUTPUT.exists():
        return {"status": "not_found", "content": None}

    with open(REPORT_OUTPUT, "r", encoding="utf-8") as f:
        content = f.read()

    return {
        "status": "found",
        "content": content,
        "hash": _compute_file_hash(REPORT_OUTPUT),
        "generated_at": datetime.fromtimestamp(
            REPORT_OUTPUT.stat().st_mtime
        ).isoformat(),
    }


@app.get("/api/report/status")
def report_status():
    """Rapor üretim durumunu döndür."""
    return _report_status.model_dump()


@app.post("/api/report/verify")
def verify_report(hash_to_verify: str = Form(...)):
    """Rapor hash'ini doğrula."""
    if not REPORT_OUTPUT.exists():
        raise HTTPException(status_code=404, detail="Rapor dosyası bulunamadı.")

    actual_hash = _compute_file_hash(REPORT_OUTPUT)
    is_valid = actual_hash == hash_to_verify

    return {
        "is_valid": is_valid,
        "actual_hash": actual_hash,
        "provided_hash": hash_to_verify,
        "verified_at": datetime.now().isoformat(),
    }


# ─── Çalıştırma ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
