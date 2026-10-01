"""
EkoFin Birleşik Backend Gateway API
Tüm modülleri (Carbon, TSRS, ESG) tek bir FastAPI uygulamasında birleştirir.
Port: 8000
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time

from config import BASE_DIR
from dotenv import load_dotenv
import database as db
from logger import logger

load_dotenv(dotenv_path=BASE_DIR / ".env")
db.init_db()

# ─── Modüler Router İmportları ───────────────────────────────────────────────
from routers.documents import router as documents_router
from routers.report import router as report_router
from routers.carbon import router as carbon_router
from routers.esg import router as esg_router
from routers.finance import router as finance_router
from routers.audits import router as audits_router
from routers.applications import router as applications_router
from routers.assistant import router as assistant_router


# ─── FastAPI Uygulaması ──────────────────────────────────────────────────────
app = FastAPI(
    title="EkoFin Birleşik Backend",
    description="Belge yükleme, TSRS rapor üretimi, karbon hesaplama, yeşil kredi skorlama ve ESG tahmini — tek API.",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── HTTP İstek ve Yanıt Loglama Middleware'i ──────────────────────────────
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    start = time.perf_counter()
    method = request.method
    path = request.url.path
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"🌐 [HTTP-GELEN] {method} {path} | İstemci: {client_ip}")
    try:
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        logger.info(f"📤 [HTTP-YANIT] {method} {path} -> Durum: {response.status_code} ({elapsed:.1f}ms)")
        return response
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        logger.error(f"💥 [HTTP-HATA] {method} {path} ({elapsed:.1f}ms) -> {e}")
        raise

# ─── Router Kayıtları ────────────────────────────────────────────────────────
app.include_router(documents_router)
app.include_router(report_router)
app.include_router(carbon_router)
app.include_router(esg_router)
app.include_router(finance_router)
app.include_router(audits_router)
app.include_router(applications_router)
app.include_router(assistant_router)


# ─── Kök Endpoint ───────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "EkoFin Birleşik Backend",
        "version": "2.1.0",
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
            "GET  /api/report/{version_id}/pdf",
            "GET  /api/report/readiness",
            "GET  /api/report/demo",
            "GET  /api/simulator/aggregate-context",
            "GET  /api/simulator/auto-context",
            "POST /api/carbon/calculate",
            "POST /api/esg/predict",
            "GET  /api/esg/health",
            "GET  /api/esg/companies",
            "GET  /api/esg/explain/{ticker}",
            "GET  /api/esg/model-card",
            "GET  /api/esg/feedback/{ticker}",
            "POST /api/esg/feedback/{ticker}",
            "GET  /api/esg/score-history/{ticker}",
            "GET  /api/esg/news/{ticker}",
            "POST /api/esg/news/{ticker}/refresh",
            "GET  /api/esg/credibility/demo",
            "GET  /api/credits",
            "GET  /api/crowdfunding",
            "GET  /api/public-audits",
            "POST /api/public-audits",
            "GET  /api/credit-applications",
            "POST /api/credit-applications",
            "GET  /api/credit-applications/{id}",
            "PATCH /api/credit-applications/{id}/status",
        ],
    }


# ─── Çalıştırma ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
