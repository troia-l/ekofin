"""
EkoFin Birleşik Backend Gateway API
Tüm alt modülleri (Documents, TSRS Report, Carbon, ESG, Finance, Audits)
tek bir FastAPI uygulamasında birleştirir.
Port: 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── Router Modülleri ────────────────────────────────────────────────────────
from routers.documents import router as documents_router
from routers.report import router as report_router
from routers.carbon import router as carbon_router
from routers.esg import router as esg_router
from routers.finance import router as finance_router
from routers.audits import router as audits_router

# ─── Geriye Dönük Uyumluluk (Backwards Compatibility) Re-exportları ───────────
import database as db
from routers.common import (
    calculator,
    DeclarationData,
    ReportStatus,
    CalculationRequest,
    FeedbackSubmit,
    AuditSubmit,
    AuditStatusUpdate,
    _load_uploads_meta,
    _save_uploads_meta,
    _compute_file_hash,
    _get_report_status,
    _set_report_status,
    COMPANY_DETAILS,
    get_cover_image,
    generate_ai_insights,
)
from routers.carbon import get_simulator_auto_context, calculate_carbon
from routers.report import generate_report, get_latest_report, report_status, verify_report
from routers.documents import dashboard_summary, upload_document, list_uploads, documents_status, delete_document, save_declaration, get_declaration
from routers.esg import get_model_card, explain_esg_score, get_esg_companies, predict_esg, esg_health
from routers.finance import get_credits, get_crowdfunding
from routers.audits import get_public_audits, add_public_audit, upvote_public_audit, update_public_audit_status

# ─── FastAPI Uygulama Tanımı ─────────────────────────────────────────────────
app = FastAPI(
    title="EkoFin Birleşik Backend",
    description="Belge yükleme, TSRS rapor üretimi, karbon hesaplama, yeşil kredi skorlama ve ESG tahmini — modüler gateway API.",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Router Kayıtları ────────────────────────────────────────────────────────
app.include_router(documents_router)
app.include_router(report_router)
app.include_router(carbon_router)
app.include_router(esg_router)
app.include_router(finance_router)
app.include_router(audits_router)


# ─── Kök Dizin Bilgisi ────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "EkoFin Birleşik Backend",
        "version": "2.1.0",
        "modules": [
            "Documents & Dashboard (/api/documents, /api/dashboard)",
            "TSRS Sürdürülebilirlik Raporu (/api/report)",
            "Karbon & Simülatör G-ROI (/api/carbon, /api/simulator)",
            "ESG Tahmin & NLP Analitiği (/api/esg)",
            "Finans & Kredi Teklifleri (/api/credits, /api/crowdfunding)",
            "Toplumsal Denetim (/api/public-audits)",
        ],
        "docs": "/docs",
    }


# ─── Çalıştırma ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
