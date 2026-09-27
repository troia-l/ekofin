"""
Belge Yükleme, OCR Durumu, Yönetici Beyanı ve Dashboard Özeti Router'ı
"""

from datetime import datetime
from typing import Optional
import json

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from config import (
    DOCUMENT_TYPE_MAP,
    get_company_sources_dir,
    get_company_declaration_path,
    get_company_report_path,
    get_company_eklenen_veriler_path,
)
from .common import (
    DeclarationData,
    _load_uploads_meta,
    _save_uploads_meta,
    _compute_file_hash,
)

router = APIRouter(tags=["Documents & Dashboard"])


@router.get("/api/dashboard/summary")
def dashboard_summary(ticker: Optional[str] = None):
    """Dashboard için özet metrikleri döndür (şirkete özel)."""
    meta = _load_uploads_meta(ticker)
    docs = meta.get("documents", {})

    declaration_path = get_company_declaration_path(ticker)
    report_path = get_company_report_path(ticker)
    eklenen_path = get_company_eklenen_veriler_path(ticker)

    total_docs = len([d for d in docs.values() if d.get("status") == "verified"])
    declaration_exists = declaration_path.exists()
    report_exists = report_path.exists()
    report_hash = ""
    if report_exists:
        report_hash = _compute_file_hash(report_path)

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


@router.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    ticker: Optional[str] = Form(None),
):
    """Belge yükle ve şirkete özel sources dizinine kaydet."""
    if doc_type not in DOCUMENT_TYPE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz belge türü: {doc_type}. Geçerli türler: {list(DOCUMENT_TYPE_MAP.keys())}",
        )

    target_filename = DOCUMENT_TYPE_MAP[doc_type]
    company_sources_dir = get_company_sources_dir(ticker)
    target_path = company_sources_dir / target_filename

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    meta = _load_uploads_meta(ticker)
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
    _save_uploads_meta(meta, ticker)

    return {
        "status": "success",
        "message": f"{file.filename} başarıyla yüklendi ve {target_filename} olarak kaydedildi.",
        "doc_type": doc_type,
        "target_filename": target_filename,
    }


@router.get("/api/documents/list")
def list_uploads(ticker: Optional[str] = None):
    """Son yüklenen dosyaların listesini (şirkete özel) döndür."""
    meta = _load_uploads_meta(ticker)
    return {"uploads": meta.get("uploads", [])}


@router.get("/api/documents/status")
def documents_status(ticker: Optional[str] = None):
    """Her belge türünün (şirkete özel) durumunu döndür."""
    meta = _load_uploads_meta(ticker)
    docs = meta.get("documents", {})

    declaration_status = "verified" if get_company_declaration_path(ticker).exists() else "not_uploaded"

    statuses = {}
    for doc_type, target_file in DOCUMENT_TYPE_MAP.items():
        if doc_type in docs:
            statuses[doc_type] = docs[doc_type]
        else:
            statuses[doc_type] = {"status": "not_uploaded"}

    statuses["declaration"] = {"status": declaration_status}

    return {"documents": statuses}


@router.delete("/api/documents/{doc_type}")
def delete_document(doc_type: str, ticker: Optional[str] = None):
    """Yüklenen bir belgeyi (fiziksel dosya + meta kaydı) kaldırır — yeniden
    yüklenebilmesi için durumu 'not_uploaded'a döner."""
    if doc_type not in DOCUMENT_TYPE_MAP:
        raise HTTPException(status_code=400, detail=f"Geçersiz belge türü: {doc_type}")

    company_sources_dir = get_company_sources_dir(ticker)
    target_path = company_sources_dir / DOCUMENT_TYPE_MAP[doc_type]
    if target_path.exists():
        target_path.unlink()

    meta = _load_uploads_meta(ticker)
    removed = meta["documents"].pop(doc_type, None)
    if removed is None:
        raise HTTPException(status_code=404, detail="Bu belge türü için yüklenmiş bir kayıt yok.")
    _save_uploads_meta(meta, ticker)

    return {"status": "success", "message": f"{doc_type} belgesi kaldırıldı."}


@router.delete("/api/documents/list/{upload_index}")
def delete_upload_log_entry(upload_index: int, ticker: Optional[str] = None):
    """'Son Yüklenen Paketler' listesindeki tek bir kaydı (sadece log girişini) kaldırır."""
    meta = _load_uploads_meta(ticker)
    uploads = meta.get("uploads", [])
    if upload_index < 0 or upload_index >= len(uploads):
        raise HTTPException(status_code=404, detail="Yükleme kaydı bulunamadı.")
    removed = uploads.pop(upload_index)
    meta["uploads"] = uploads
    _save_uploads_meta(meta, ticker)
    return {"status": "success", "removed": removed}


@router.post("/api/declaration")
def save_declaration(data: DeclarationData, ticker: Optional[str] = None):
    """Yönetici Anketi verisini şirkete özel JSON olarak kaydet."""
    declaration_path = get_company_declaration_path(ticker)
    payload = data.model_dump(exclude_none=True)
    payload["submitted_at"] = datetime.now().isoformat()

    with open(declaration_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return {
        "status": "success",
        "message": "Yönetici beyanı kaydedildi.",
        "path": str(declaration_path),
    }


@router.get("/api/declaration")
def get_declaration(ticker: Optional[str] = None):
    """Kayıtlı (şirkete özel) yönetici anketi verisini getir."""
    declaration_path = get_company_declaration_path(ticker)
    if not declaration_path.exists():
        return {"status": "not_found", "data": None}
    with open(declaration_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"status": "found", "data": data}


@router.delete("/api/declaration")
def delete_declaration(ticker: Optional[str] = None):
    """Kayıtlı yönetici anketini kaldırır (yeniden doldurulabilmesi için)."""
    declaration_path = get_company_declaration_path(ticker)
    if not declaration_path.exists():
        raise HTTPException(status_code=404, detail="Kayıtlı bir yönetici beyanı yok.")
    declaration_path.unlink()
    return {"status": "success", "message": "Yönetici beyanı kaldırıldı."}
