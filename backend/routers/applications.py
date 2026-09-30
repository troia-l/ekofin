"""
Yeşil Kredi Başvuruları Router'ı (Simülatör → Banka Portalı)
"""

from typing import Optional
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import database as db
from config import get_company_report_path
from .common import _compute_file_hash


router = APIRouter(tags=["Credit Applications"])


class CreditApplicationSubmit(BaseModel):
    ticker: Optional[str] = None
    company_name: str
    bank_name: str
    bank_rate: float
    base_rate: float
    discount_pct: float
    loan_amount: float
    loan_years: int
    monthly_payment: float
    green_credit_score: int
    decision: str
    total_capex: Optional[float] = None


class ApplicationStatusUpdate(BaseModel):
    status: str


@router.post("/api/credit-applications")
def create_credit_application(data: CreditApplicationSubmit):
    """Simülatörden seçilen banka teklifi için başvuru oluşturur. Şirketin
    o anda üretilmiş bir TSRS raporu varsa hash'i başvuruya damgalanır —
    banka tarafı bu hash'i /api/report/verify ile bağımsız doğrulayabilir."""
    report_hash = None
    if data.ticker:
        report_path = get_company_report_path(data.ticker)
        if report_path.exists():
            report_hash = _compute_file_hash(report_path)

    payload = data.model_dump()
    payload["report_hash"] = report_hash
    new_app = db.add_credit_application(payload)
    return {"status": "success", "application": new_app}


@router.get("/api/credit-applications")
def get_credit_applications():
    """Banka portalı için tüm başvuruları (en yeni en üstte) döndürür."""
    return db.list_credit_applications()


@router.get("/api/credit-applications/{app_id}")
def get_credit_application(app_id: int):
    app_data = db.get_credit_application(app_id)
    if app_data is None:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı.")
    return app_data


@router.patch("/api/credit-applications/{app_id}/status")
def update_credit_application_status(app_id: int, data: ApplicationStatusUpdate):
    """Banka tarafının başvuruyu Onaylandı/Reddedildi olarak işaretlemesi."""
    updated = db.set_credit_application_status(app_id, data.status.strip())
    if updated is None:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı.")
    return {"status": "success", "application": updated}
