"""Kalıcı TSRS rapor işleri, readiness, sürümleme ve simülatör bağlamı."""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sqlite3
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from datetime import datetime, timezone
import time
from pathlib import Path
from typing import Any

import database
from config import BASE_DIR, get_company_sources_dir
from logger import logger, log_llm_request, log_llm_response, log_llm_fallback


TERMINAL_STATUSES = {"completed", "completed_with_warnings", "failed", "interrupted"}
ACTIVE_STATUSES = {"queued", "running"}
CRITICAL_SOURCES = {
    "faaliyet": "şirket-faliyet-raporu.md",
    "mizan": "mizan.md",
    "fatura": "faturalar.md",
    "declaration": "yonetici_anketi.json",
}
TICKER_RE = re.compile(r"^[A-Z0-9][A-Z0-9._-]{0,15}$")
PROMPT_VERSION = "tsrs-v2"
FACTOR_VERSION = "fixture-v1"
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="tsrs-report")
_submit_lock = threading.Lock()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def _connect():
    conn = sqlite3.connect(database.DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def normalize_ticker(ticker: str | None) -> str:
    value = (ticker or "").strip().upper()
    if not TICKER_RE.fullmatch(value) or ".." in value:
        raise ValueError("Geçersiz şirket kodu.")
    sources_root = (BASE_DIR / "data" / "sources").resolve()
    candidate = (sources_root / value).resolve()
    if sources_root not in candidate.parents:
        raise ValueError("Geçersiz şirket kodu.")
    return value


def init_report_tables() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS report_jobs (
                id TEXT PRIMARY KEY, ticker TEXT NOT NULL, reporting_year INTEGER NOT NULL,
                status TEXT NOT NULL, stage TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0,
                message TEXT NOT NULL DEFAULT '', error_code TEXT, error_details_json TEXT,
                source_fingerprint TEXT, report_version_id TEXT, created_at TEXT NOT NULL,
                started_at TEXT, finished_at TEXT, updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_report_jobs_company
                ON report_jobs(ticker, reporting_year, created_at DESC);
            CREATE TABLE IF NOT EXISTS report_versions (
                id TEXT PRIMARY KEY, ticker TEXT NOT NULL, reporting_year INTEGER NOT NULL,
                status TEXT NOT NULL, markdown_path TEXT NOT NULL, sha256 TEXT,
                source_fingerprint TEXT NOT NULL, validation_status TEXT NOT NULL,
                validation_details_json TEXT NOT NULL, model_provider TEXT NOT NULL,
                model_name TEXT NOT NULL, prompt_version TEXT NOT NULL,
                created_at TEXT NOT NULL, published_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_report_versions_company
                ON report_versions(ticker, reporting_year, published_at DESC);
            CREATE TABLE IF NOT EXISTS simulator_contexts (
                id TEXT PRIMARY KEY, report_version_id TEXT NOT NULL UNIQUE,
                ticker TEXT NOT NULL, reporting_year INTEGER NOT NULL, status TEXT NOT NULL,
                current_status TEXT, recommendation TEXT, suggested_investments_json TEXT,
                activity_text TEXT, model_provider TEXT, model_name TEXT,
                error_code TEXT, error_message TEXT, created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        now = utc_now()
        conn.execute(
            """UPDATE report_jobs SET status='interrupted', stage='interrupted', progress=0,
               message='Backend yeniden başlatıldığı için iş kesildi.', error_code='server_restarted',
               finished_at=?, updated_at=? WHERE status IN ('queued','running','snapshotting','normalizing','generating','validating','publishing','generating_context')""",
            (now, now),
        )


def _source_files(ticker: str) -> list[Path]:
    root = get_company_sources_dir(ticker)
    return sorted((p for p in root.iterdir() if p.is_file() and not p.name.startswith("_")), key=lambda p: p.name)


def source_fingerprint(ticker: str, reporting_year: int) -> str:
    payload: dict[str, Any] = {
        "reporting_year": reporting_year,
        "factor_version": FACTOR_VERSION,
        "prompt_version": PROMPT_VERSION,
        "files": [],
    }
    for path in _source_files(ticker):
        payload["files"].append({"name": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _published_report(conn: sqlite3.Connection, ticker: str, reporting_year: int) -> sqlite3.Row | None:
    return conn.execute(
        """SELECT * FROM report_versions WHERE ticker=? AND reporting_year=? AND status='published'
           ORDER BY published_at DESC LIMIT 1""",
        (ticker, reporting_year),
    ).fetchone()


def get_readiness(ticker: str, reporting_year: int) -> dict[str, Any]:
    ticker = normalize_ticker(ticker)
    root = get_company_sources_dir(ticker)
    present = {key: (root / filename).is_file() for key, filename in CRITICAL_SOURCES.items()}
    missing = [key for key, exists in present.items() if not exists]
    files = _source_files(ticker)
    data_state = "empty" if not files else ("incomplete" if missing else "ready")
    current_fp = source_fingerprint(ticker, reporting_year) if files else None
    latest_source = max((p.stat().st_mtime for p in files), default=None)
    latest_source_iso = datetime.fromtimestamp(latest_source, timezone.utc).isoformat() if latest_source else None

    with _connect() as conn:
        report = _published_report(conn, ticker, reporting_year)
        active = conn.execute(
            """SELECT id FROM report_jobs WHERE ticker=? AND reporting_year=?
               AND status IN ('queued','running','snapshotting','normalizing','generating','validating','publishing','generating_context')
               ORDER BY created_at DESC LIMIT 1""",
            (ticker, reporting_year),
        ).fetchone()
    reasons: list[str] = []
    if report is None:
        report_state = "generating" if active else "missing"
    elif missing:
        report_state = "stale"
        reasons.append("critical_source_missing")
    elif report["source_fingerprint"] != current_fp:
        report_state = "stale"
        reasons.append("source_changed")
    else:
        report_state = "current"
    last_report = None if report is None else {
        "id": report["id"], "generated_at": report["published_at"], "sha256": report["sha256"],
        "validation_status": report["validation_status"],
    }
    return {
        "ticker": ticker, "reporting_year": reporting_year, "data_state": data_state,
        "critical_documents": {"required": list(CRITICAL_SOURCES), "present": present, "missing": missing},
        "latest_source_updated_at": latest_source_iso, "report_state": report_state,
        "active_job_id": active["id"] if active else None, "last_report": last_report,
        "freshness": {"is_current": report_state == "current", "reasons": reasons},
        "can_generate": data_state == "ready" and active is None,
        "can_use_simulator": report_state == "current",
    }


def _update_job(job_id: str, *, status: str, stage: str, progress: int, message: str,
                error_code: str | None = None, error_details: Any = None,
                report_version_id: str | None = None, finished: bool = False) -> None:
    logger.info(f"📊 [TSRS-İŞ-DURUM] İş: {job_id} | Aşama: {stage} | İlerleme: %{progress} | Durum: {status} | Mesaj: {message}")
    now = utc_now()
    with _connect() as conn:
        conn.execute(
            """UPDATE report_jobs SET status=?,stage=?,progress=?,message=?,error_code=?,
               error_details_json=?,report_version_id=COALESCE(?,report_version_id),
               finished_at=CASE WHEN ? THEN ? ELSE finished_at END,updated_at=? WHERE id=?""",
            (status, stage, progress, message, error_code,
             json.dumps(error_details, ensure_ascii=False) if error_details is not None else None,
             report_version_id, int(finished), now, now, job_id),
        )


def create_job(ticker: str, reporting_year: int) -> dict[str, str]:
    ticker = normalize_ticker(ticker)
    readiness = get_readiness(ticker, reporting_year)
    if readiness["data_state"] != "ready":
        raise MissingSourcesError(readiness["critical_documents"]["missing"])
    with _submit_lock, _connect() as conn:
        active = conn.execute(
            """SELECT id,status FROM report_jobs WHERE ticker=? AND reporting_year=?
               AND status IN ('queued','running','snapshotting','normalizing','generating','validating','publishing','generating_context')
               ORDER BY created_at DESC LIMIT 1""", (ticker, reporting_year),
        ).fetchone()
        if active:
            raise ActiveJobError(active["id"])
        job_id = str(uuid.uuid4())
        now = utc_now()
        conn.execute(
            """INSERT INTO report_jobs(id,ticker,reporting_year,status,stage,progress,message,created_at,updated_at)
               VALUES(?,?,?,?,?,?,?,?,?)""",
            (job_id, ticker, reporting_year, "queued", "queued", 0, "Rapor işi sıraya alındı.", now, now),
        )
    _executor.submit(_run_job, job_id, ticker, reporting_year)
    return {"job_id": job_id, "status": "queued", "status_url": f"/api/report/jobs/{job_id}"}


def get_job(job_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM report_jobs WHERE id=?", (job_id,)).fetchone()
    if not row:
        return None
    error = None
    if row["error_code"]:
        details = json.loads(row["error_details_json"] or "null")
        error = {
            "code": row["error_code"],
            "message": details.get("message") if isinstance(details, dict) else None,
            "details": details,
        }
    return {
        "job_id": row["id"], "ticker": row["ticker"], "reporting_year": row["reporting_year"],
        "status": row["status"], "stage": row["stage"], "progress": row["progress"],
        "message": row["message"], "report_version_id": row["report_version_id"],
        "error": error, "updated_at": row["updated_at"],
    }


def _validate_report(text: str) -> list[str]:
    errors: list[str] = []
    forbidden = {
        r"KGK\s+Bağımsız\s+Denetçi\s+Portalı[^\n.]{0,80}(?:ile|üzerinden)\s+(?:kriptografik\s+olarak\s+)?doğrulan": "Gerçekleşmemiş KGK portal doğrulaması",
        r"passport-id-\[Dinamik_ID\]": "Çözümlenmemiş doğrulama URL'si",
        r"!\[\]\[image\d+\]": "Çözümlenmemiş görsel referansı",
        r"tüm\s+hükümleriyle\s+tam\s+uyumlu\s+ve\s+koşulsuz": "Kanıtsız tam uyum beyanı",
    }
    for pattern, message in forbidden.items():
        if re.search(pattern, text, re.IGNORECASE):
            errors.append(message)
    if len(text.strip()) < 1000:
        errors.append("Rapor içeriği beklenenden kısa")
    return errors


def _snapshot_sources(ticker: str, job_dir: Path) -> Path:
    target = job_dir / "sources"
    target.mkdir(parents=True, exist_ok=True)
    for source in _source_files(ticker):
        shutil.copy2(source, target / source.name)
    return target


def _run_job(job_id: str, ticker: str, reporting_year: int) -> None:
    job_dir = BASE_DIR / "output" / ticker / "runs" / job_id
    draft_path = job_dir / "report.md"
    eklenen_path = job_dir / "eklenen_veriler.md"
    try:
        now = utc_now()
        with _connect() as conn:
            conn.execute("UPDATE report_jobs SET started_at=?,updated_at=? WHERE id=?", (now, now, job_id))
        _update_job(job_id, status="running", stage="snapshotting", progress=5, message="Kaynak belgelerin değişmez kopyası hazırlanıyor.")
        sources_dir = _snapshot_sources(ticker, job_dir)
        fingerprint = source_fingerprint(ticker, reporting_year)
        with _connect() as conn:
            conn.execute("UPDATE report_jobs SET source_fingerprint=?,updated_at=? WHERE id=?", (fingerprint, utc_now(), job_id))
        _update_job(job_id, status="running", stage="normalizing", progress=10, message="Veriler doğrulanıyor ve ortak formata dönüştürülüyor.")

        from modules.tsrs.pipeline import run_tsrs_pipeline
        progress_points = [15, 22, 29, 36, 43, 50, 57, 64, 71, 78]
        titles = ["Kapak ve rapor kimliği", "Rapor kapsamı", "Yönetişim", "Strateji", "Risk yönetimi",
                  "Metrikler ve hedefler", "Muhakemeler", "Ekler ve metodoloji", "İletişim", "Güvence açıklaması"]

        def progress_cb(_filename: str, current: int, _total: int) -> None:
            index = max(0, min(current - 1, len(progress_points) - 1))
            _update_job(job_id, status="running", stage="generating", progress=progress_points[index], message=f"{titles[index]} bölümü hazırlanıyor.")

        result = run_tsrs_pipeline(progress_callback=progress_cb, sources_dir=sources_dir, report_path=draft_path, eklenen_path=eklenen_path, reporting_year=reporting_year)
        if result.get("status") != "success" or not draft_path.exists():
            raise RuntimeError(result.get("error") or "Pipeline rapor üretmedi.")
        _update_job(job_id, status="running", stage="validating", progress=86, message="Rapor tutarlılık kontrolünden geçiriliyor.")
        text = draft_path.read_text(encoding="utf-8")
        errors = _validate_report(text)
        version_id = str(uuid.uuid4())
        created = utc_now()
        with _connect() as conn:
            conn.execute(
                """INSERT INTO report_versions(id,ticker,reporting_year,status,markdown_path,source_fingerprint,
                   validation_status,validation_details_json,model_provider,model_name,prompt_version,created_at)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
                (version_id, ticker, reporting_year, "rejected" if errors else "draft", str(draft_path), fingerprint,
                 "failed" if errors else "passed", json.dumps(errors, ensure_ascii=False), "openai",
                 os.getenv("OPENAI_TSRS_MODEL", "gpt-5.4"), PROMPT_VERSION, created),
            )
        if errors:
            _update_job(job_id, status="failed", stage="validating", progress=86,
                        message="Rapor kalite kontrolünden geçemedi.", error_code="validation_failed",
                        error_details={"errors": errors}, report_version_id=version_id, finished=True)
            return

        _update_job(job_id, status="running", stage="publishing", progress=92, message="Doğrulanan rapor yayımlanıyor.")
        published_dir = BASE_DIR / "output" / ticker / "reports" / version_id
        published_dir.mkdir(parents=True, exist_ok=True)
        published_path = published_dir / "TSRS_Uyumlu_Surdurulebilirlik_Raporu.md"
        shutil.copy2(draft_path, published_path)
        digest = "0x" + hashlib.sha256(published_path.read_bytes()).hexdigest()
        published_at = utc_now()
        with _connect() as conn:
            conn.execute("UPDATE report_versions SET status='published',markdown_path=?,sha256=?,published_at=? WHERE id=?",
                         (str(published_path), digest, published_at, version_id))
        _update_job(job_id, status="running", stage="generating_context", progress=95,
                    message="g-ROI şirket durumu ve tavsiyeleri hazırlanıyor.", report_version_id=version_id)
        context_error = _generate_context(version_id, ticker, reporting_year, text)
        if context_error:
            _update_job(job_id, status="completed_with_warnings", stage="completed", progress=100,
                        message="Rapor hazır; g-ROI tavsiyesi üretilemedi.", error_code="context_generation_failed",
                        error_details={"message": context_error}, report_version_id=version_id, finished=True)
        else:
            _update_job(job_id, status="completed", stage="completed", progress=100,
                        message="Rapor ve simülatör bağlamı hazır.", report_version_id=version_id, finished=True)
    except Exception as exc:
        _update_job(job_id, status="failed", stage="failed", progress=0, message="Rapor oluşturulamadı.",
                    error_code="generation_failed", error_details={"message": str(exc)[:1000]}, finished=True)


def _generate_context(version_id: str, ticker: str, reporting_year: int, report_text: str) -> str | None:
    context_id = str(uuid.uuid4())
    now = utc_now()
    with _connect() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO simulator_contexts(id,report_version_id,ticker,reporting_year,status,created_at,updated_at)
               VALUES(?,?,?,?,?,?,?)""", (context_id, version_id, ticker, reporting_year, "pending", now, now),
        )
    try:
        from langchain_openai import ChatOpenAI
        from pydantic import BaseModel, Field

        class ContextOutput(BaseModel):
            current_status: str
            recommendation: str
            activity_text: str
            ges_budget: int = Field(ge=0)
            ev_count: int = Field(ge=0)
            eff_budget: int = Field(ge=0)
            waste_budget: int = Field(ge=0)
            water_budget: int = Field(ge=0)

        # Kaynak: https://ai.google.dev/gemini-api/docs/openai?hl=tr
        key = (os.getenv("OPENAI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")).strip()
        if not key:
            raise RuntimeError("OPENAI_API_KEY veya GEMINI_API_KEY yapılandırılmamış.")
        
        is_gemini = not os.getenv("OPENAI_API_KEY") and bool(os.getenv("GEMINI_API_KEY"))
        default_base = "https://generativelanguage.googleapis.com/v1beta/openai/" if is_gemini else None
        default_model = "gemini-2.5-flash" if is_gemini else "gpt-5.4"
        
        if is_gemini:
            api_base = os.getenv("GEMINI_API_BASE") or default_base
            model_name = os.getenv("GEMINI_MODEL") or default_model
        else:
            api_base = os.getenv("OPENAI_API_BASE") or default_base
            model_name = os.getenv("OPENAI_GROI_MODEL") or os.getenv("OPENAI_TSRS_MODEL") or default_model

        model = ChatOpenAI(
            model=model_name,
            api_key=key,
            base_url=api_base,
            temperature=0,
            request_timeout=120,
            max_retries=3,
        )
        structured = model.with_structured_output(ContextOutput)
        prompt_str = (
            "Aşağıdaki doğrulanmış TSRS raporuna dayanarak kısa şirket durumu ve 2-3 maddelik yeşil yatırım tavsiyesi üret. "
            "Raporda bulunmayan sayı, tesis, sertifika veya doğrulama iddiası ekleme. Bütçeleri ihtiyatlı öneri olarak ver.\n\n"
            + report_text[:50000]
        )
        provider_name = "Gemini" if is_gemini else "OpenAI"
        log_llm_request(provider=provider_name, model=model_name, task="TSRS Simülatör Bağlamı", prompt_preview=prompt_str)
        t0 = time.perf_counter()
        output = structured.invoke(prompt_str)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        log_llm_response(provider=provider_name, model=model_name, task="TSRS Simülatör Bağlamı", elapsed_ms=elapsed_ms, success=True, details=f"Durum: {output.current_status[:40]}...")
        investments = {"ges_budget": output.ges_budget, "ev_count": output.ev_count,
                       "eff_budget": output.eff_budget, "waste_budget": output.waste_budget,
                       "water_budget": output.water_budget}
        with _connect() as conn:
            conn.execute(
                """UPDATE simulator_contexts SET status='ready',current_status=?,recommendation=?,activity_text=?,
                   suggested_investments_json=?,model_provider='openai',model_name=?,updated_at=? WHERE report_version_id=?""",
                (output.current_status, output.recommendation, output.activity_text,
                 json.dumps(investments, ensure_ascii=False), model.model_name, utc_now(), version_id),
            )
        return None
    except Exception as exc:
        log_llm_response(provider="LLM", model=locals().get("model_name", "unknown"), task="TSRS Simülatör Bağlamı", elapsed_ms=0, success=False, details=str(exc))
        log_llm_fallback(task="TSRS Simülatör Bağlamı", original_provider="LLM", fallback_to="Yok (Hata)", reason=str(exc))
        with _connect() as conn:
            conn.execute("UPDATE simulator_contexts SET status='failed',error_code='context_generation_failed',error_message=?,updated_at=? WHERE report_version_id=?",
                         (str(exc)[:1000], utc_now(), version_id))
        return str(exc)


def get_latest_report(ticker: str, reporting_year: int) -> dict[str, Any]:
    ticker = normalize_ticker(ticker)
    with _connect() as conn:
        row = _published_report(conn, ticker, reporting_year)
    if not row:
        return {"status": "not_found", "report": None}
    path = Path(row["markdown_path"])
    if not path.exists():
        return {"status": "not_found", "report": None}
    readiness = get_readiness(ticker, reporting_year)
    report = {"id": row["id"], "content": path.read_text(encoding="utf-8"), "hash": row["sha256"],
              "generated_at": row["published_at"], "reporting_year": reporting_year,
              "validation_status": row["validation_status"], "is_current": readiness["freshness"]["is_current"]}
    return {"status": "found", "report": report, **report}


def get_simulator_context(ticker: str, reporting_year: int) -> dict[str, Any]:
    readiness = get_readiness(ticker, reporting_year)
    if readiness["data_state"] == "empty":
        state = "missing_data"
    elif readiness["data_state"] == "incomplete":
        state = "data_incomplete"
    elif readiness["last_report"] is None:
        state = "report_missing"
    elif readiness["report_state"] == "stale":
        state = "report_stale"
    else:
        state = "ready"
    report = readiness["last_report"]
    context = None
    if report:
        with _connect() as conn:
            context = conn.execute("SELECT * FROM simulator_contexts WHERE report_version_id=?", (report["id"],)).fetchone()
        if context is None:
            state = "context_pending"
        elif context["status"] == "failed":
            state = "context_failed"
        elif readiness["report_state"] == "current":
            state = "ready"
    expose = context is not None and context["status"] == "ready" and state == "ready"
    return {
        "state": state, "usable": state == "ready", "missing_critical_documents": readiness["critical_documents"]["missing"],
        # Eski istemciler için bilgi alanı korunur; bu metin bir AI durum/tavsiye
        # çıktısı değildir ve gROI arayüzünde gösterilmez.
        "context": context["current_status"] if expose else f"{ticker} teknoloji sektöründe faaliyet göstermektedir; yayımlanmış TSRS raporu bulunmadığı için AI durumu üretilmedi.",
        "report": None if not report else {"id": report["id"], "generated_at": report["generated_at"],
                                             "is_current": readiness["freshness"]["is_current"]},
        "current_status": context["current_status"] if expose else None,
        "llm_recommendation": context["recommendation"] if expose else None,
        "activity_text": context["activity_text"] if expose else None,
        "suggested_investments": json.loads(context["suggested_investments_json"]) if expose else None,
    }


class MissingSourcesError(Exception):
    def __init__(self, missing: list[str]):
        super().__init__("Kritik kaynaklar eksik.")
        self.missing = missing


class ActiveJobError(Exception):
    def __init__(self, job_id: str):
        super().__init__("Aktif rapor işi var.")
        self.job_id = job_id


init_report_tables()
