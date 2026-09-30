"""Kalıcı/asenkron TSRS rapor API'si."""
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone
import hashlib
from fastapi import APIRouter, BackgroundTasks, Form, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from modules.tsrs.job_service import ActiveJobError, MissingSourcesError, _connect, _run_job, create_job, get_job, get_latest_report as service_get_latest_report, get_readiness, normalize_ticker

router = APIRouter(tags=["TSRS Report"])
class GenerateReportRequest(BaseModel):
    reporting_year: int = Field(ge=2000, le=2100)

# Eski Python istemcileri ve testler için isim uyumluluğu.
GenerateRequest = GenerateReportRequest
background_report_worker = _run_job
def _ticker(value: Optional[str]) -> str:
    try: return normalize_ticker(value)
    except ValueError as exc: raise HTTPException(422, detail={"code":"invalid_ticker","message":str(exc)}) from exc

DEMO_REPORT_ID = "demo-ASELS-2025"

def _demo_report_payload() -> dict:
    demo_path = Path(__file__).resolve().parents[1] / "data" / "demo" / "ASELSAN_TSRS_DEMO_RAPORU.md"
    if not demo_path.is_file():
        raise HTTPException(404, detail="Demo TSRS raporu bulunamadı.")
    content = demo_path.read_text(encoding="utf-8")
    return {
        "status": "demo", "id": DEMO_REPORT_ID, "ticker": "ASELS", "reporting_year": 2025,
        "content": content, "hash": "0x" + hashlib.sha256(content.encode("utf-8")).hexdigest(),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "validation_status": "demo", "is_current": False, "is_demo": True,
        "message": "Sentetik ASELS demo belgelerinden hazırlanan rapor örneği; gerçek rapor üretimi değildir.",
    }

@router.get("/api/report/readiness")
def readiness(ticker: Optional[str]=None, reporting_year: int=2025): return get_readiness(_ticker(ticker), reporting_year)
@router.post("/api/report/generate", status_code=202)
def generate_report(payload: GenerateReportRequest, ticker: Optional[str]=None, background_tasks: BackgroundTasks=None):
    # Önceki doğrudan Python çağrısı: generate_report(ticker, request, tasks).
    # HTTP sözleşmesi aşağıdaki normal yoldan ve readiness doğrulamasıyla çalışır.
    if isinstance(payload, str) and isinstance(ticker, GenerateReportRequest):
        import uuid
        from datetime import datetime, timezone
        legacy_ticker, request = _ticker(payload), ticker
        now = datetime.now(timezone.utc).isoformat()
        with _connect() as conn:
            active = conn.execute(
                "SELECT id FROM report_jobs WHERE ticker=? AND reporting_year=? AND status IN ('queued','running','generating','snapshotting','normalizing','validating','publishing','generating_context') LIMIT 1",
                (legacy_ticker, request.reporting_year),
            ).fetchone()
            if active:
                raise HTTPException(409, detail={"code":"report_job_active","details":{"job_id":active["id"]}})
            job_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO report_jobs (id,ticker,reporting_year,status,stage,progress,message,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                (job_id,legacy_ticker,request.reporting_year,"queued","queued",0,"Rapor işi kuyruğa alındı.",now,now),
            )
        if background_tasks is not None:
            background_tasks.add_task(background_report_worker, job_id, legacy_ticker, request.reporting_year)
        return {"job_id":job_id,"status":"queued"}
    try: return create_job(_ticker(ticker), payload.reporting_year)
    except MissingSourcesError as exc: raise HTTPException(422, detail={"code":"critical_sources_missing","message":"Rapor için gerekli veriler eksik.","details":{"missing":exc.missing}}) from exc
    except ActiveJobError as exc: raise HTTPException(409, detail={"code":"report_job_active","message":"Rapor üretimi devam ediyor.","details":{"job_id":exc.job_id}}) from exc
@router.get("/api/report/jobs/{job_id}")
def report_job(job_id: str):
    job=get_job(job_id)
    if not job: raise HTTPException(404, detail={"code":"job_not_found","message":"Rapor işi bulunamadı."})
    return job

# Eski doğrudan çağrı adı.
get_job_status = report_job
@router.get("/api/report/latest")
def get_latest_report(ticker: Optional[str]=None, reporting_year: int=2025): return service_get_latest_report(_ticker(ticker), reporting_year)

@router.get("/api/report/demo")
def get_demo_report(ticker: Optional[str] = "ASELS", reporting_year: int = 2025):
    if _ticker(ticker) != "ASELS" or reporting_year != 2025:
        raise HTTPException(404, detail="Bu demo raporu yalnızca ASELS / 2025 için hazırlandı.")
    return _demo_report_payload()

@router.get("/api/report/status")
def report_status(ticker: Optional[str]=None, reporting_year: int=2025):
    state=get_readiness(_ticker(ticker), reporting_year)
    if not state["active_job_id"]:
        return {"status":"idle","stage":"idle","progress":0,"message":"","job_id":None}
    job = get_job(state["active_job_id"])
    if job["status"] in {"queued", "running"}:
        job["status"] = "generating"
    elif job["status"] == "failed":
        job["status"] = "error"
    return job
@router.post("/api/report/verify")
def verify_report(hash_to_verify: str = Form(...), ticker: Optional[str] = Form(None)):
    """Verilen SHA-256 hash'ini yayımlanmış raporlarla karşılaştırarak doğrular.
    ApplicationDetail.jsx FormData ile gönderiyor; bu yüzden Form parametreleri kullanılır."""
    if not hash_to_verify:
        raise HTTPException(400, detail="hash_to_verify parametresi gerekli.")

    # Önce report_versions tablosundan eşleşme ara
    with _connect() as conn:
        row = conn.execute(
            "SELECT id, ticker, reporting_year, sha256, published_at FROM report_versions WHERE sha256=? AND status='published' LIMIT 1",
            (hash_to_verify,),
        ).fetchone()

    if row:
        return {
            "is_valid": True,
            "actual_hash": row["sha256"],
            "provided_hash": hash_to_verify,
            "matched_report_id": row["id"],
            "ticker": row["ticker"],
            "reporting_year": row["reporting_year"],
            "verified_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }

    # DB'de eşleşme yoksa dosya sistemi fallback (eski rapor formatı uyumluluğu)
    if ticker:
        from config import get_company_report_path
        from .common import _compute_file_hash
        report_path = get_company_report_path(ticker)
        if report_path.exists():
            actual_hash = _compute_file_hash(report_path)
            return {
                "is_valid": actual_hash == hash_to_verify,
                "actual_hash": actual_hash,
                "provided_hash": hash_to_verify,
                "verified_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }

    return {
        "is_valid": False,
        "actual_hash": None,
        "provided_hash": hash_to_verify,
        "verified_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
@router.get("/api/report/{version_id}/download")
def download_report(version_id: str):
    from modules.tsrs.job_service import _connect
    with _connect() as conn: row=conn.execute("SELECT markdown_path FROM report_versions WHERE id=? AND status='published'",(version_id,)).fetchone()
    if not row or not Path(row["markdown_path"]).exists(): raise HTTPException(404, detail="Rapor bulunamadı.")
    return FileResponse(row["markdown_path"],media_type="text/markdown",filename="TSRS_Raporu.md")

@router.get("/api/report/{version_id}/pdf")
def report_pdf(version_id: str, download: bool = False):
    is_demo = version_id == DEMO_REPORT_ID
    if is_demo:
        demo = _demo_report_payload()
        ticker, reporting_year = demo["ticker"], demo["reporting_year"]
        markdown_path = Path(__file__).resolve().parents[1] / "data" / "demo" / "ASELSAN_TSRS_DEMO_RAPORU.md"
        content_hash, published_at, validation_status = demo["hash"], demo["generated_at"], "demo"
    else:
        from modules.tsrs.job_service import _connect
        with _connect() as conn:
            row = conn.execute(
                "SELECT ticker,reporting_year,markdown_path,sha256,published_at,validation_status "
                "FROM report_versions WHERE id=? AND status='published'",
                (version_id,),
            ).fetchone()
        if not row or not Path(row["markdown_path"]).exists():
            raise HTTPException(404, detail="Yayımlanmış rapor bulunamadı.")
        ticker, reporting_year = row["ticker"], row["reporting_year"]
        markdown_path = Path(row["markdown_path"])
        content_hash, published_at, validation_status = row["sha256"], row["published_at"], row["validation_status"]

    try:
        from modules.tsrs.pdf_export import create_report_pdf
        markdown = markdown_path.read_text(encoding="utf-8")
        pdf_bytes = create_report_pdf(
            markdown=markdown,
            ticker=ticker,
            reporting_year=reporting_year,
            generated_at=published_at,
            content_hash=content_hash,
            validation_status=validation_status,
            is_demo=is_demo,
        )
    except ImportError as exc:
        raise HTTPException(503, detail="PDF çıktısı için reportlab bağımlılığı kurulu değil.") from exc
    except Exception as exc:
        raise HTTPException(500, detail=f"PDF oluşturulamadı: {str(exc)[:300]}") from exc

    disposition = "attachment" if download else "inline"
    filename = f"TSRS_Raporu_{ticker}_{reporting_year}{'_DEMO' if is_demo else ''}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
