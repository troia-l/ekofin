"""
Toplumsal Denetim (Public Audit) ve İhbar Yönetimi Router'ı
"""

from typing import Optional
from fastapi import APIRouter, HTTPException

import database as db
from .common import (
    AuditSubmit,
    AuditStatusUpdate,
    _run_nlp,
)

router = APIRouter(tags=["Public Audits"])


@router.get("/api/public-audits")
def get_public_audits(ticker: Optional[str] = None):
    """Tüm toplumsal denetim ihbarlarını (opsiyonel ticker filtresiyle) getir."""
    return db.list_audits(ticker)


@router.post("/api/public-audits")
def add_public_audit(data: AuditSubmit):
    """Yeni bir ihlal bildirme ve kaydetme. Açıklama NLP ile analiz edilir; skoru etkilemesi için ayrıca doğrulanması gerekir."""
    nlp_result = _run_nlp(data.description)
    new_item = db.add_audit(data.ticker, data.company.strip(), data.category.strip(), data.description.strip(), nlp_result)
    return {"status": "success", "message": "Bildirim başarıyla kaydedildi.", "audit": new_item}


@router.post("/api/public-audits/{audit_id}/upvote")
def upvote_public_audit(audit_id: int):
    """Bir ihbarı upvote et."""
    try:
        new_count = db.upvote_audit(audit_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="İhbar bulunamadı.")
    return {"status": "success", "upvotes": new_count}


@router.patch("/api/public-audits/{audit_id}/status")
def update_public_audit_status(audit_id: int, data: AuditStatusUpdate):
    """İhbar durumunu günceller (moderasyon). Sadece 'Doğrulandı...' statüsüne geçenler ESG skor
    modülasyonuna dahil edilir."""
    try:
        updated = db.set_audit_status(audit_id, data.status.strip())
    except KeyError:
        raise HTTPException(status_code=404, detail="İhbar bulunamadı.")
    return {"status": "success", "audit": updated}
