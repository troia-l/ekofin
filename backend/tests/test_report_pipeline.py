import pytest
import tempfile
import uuid
import os
from pathlib import Path
from datetime import datetime

import database as db
from routers import report
from fastapi import BackgroundTasks, HTTPException

@pytest.fixture
def temp_db(monkeypatch):
    """Testler için geçici izole SQLite veritabanı oluşturur."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_db_path = Path(tmpdir) / "test_ekofin.db"
        monkeypatch.setattr(db, "DB_PATH", tmp_db_path)
        db.init_db()
        yield tmp_db_path

class TestReportPipeline:
    """TSRS Rapor pipeline'ının backend (readiness, generate, jobs, latest) testleri."""

    def test_database_tables_exist(self, temp_db):
        """init_db sonrasında yeni tabloların var olduğunu kontrol et."""
        with db.get_conn() as conn:
            tables = [r["name"] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
            assert "report_jobs" in tables
            assert "report_versions" in tables
            assert "simulator_contexts" in tables

    def test_readiness_endpoint_empty(self, temp_db):
        """Hiçbir iş veya rapor yokken readiness kontrolü."""
        data = report.get_readiness("TEST_CO", 2025)
        assert data["ticker"] == "TEST_CO"
        assert data["report_state"] == "missing"
        assert data["active_job_id"] is None
        assert data["last_report"] is None

    def test_generate_report_queues_job(self, temp_db, monkeypatch):
        """Rapor üretme isteği kuyruğa iş eklemeli."""
        def dummy_worker(job_id, ticker, year):
            pass

        monkeypatch.setattr(report, "background_report_worker", dummy_worker)
        
        req = report.GenerateRequest(reporting_year=2025)
        bt = BackgroundTasks()
        
        data = report.generate_report("TEST_CO", req, bt)
        
        assert "job_id" in data
        assert data["status"] == "queued"
        
        job_id = data["job_id"]

        job_data = report.get_job_status(job_id)
        
        assert job_data["status"] == "queued"

    def test_generate_report_conflict(self, temp_db):
        """Aktif bir iş varken ikinci üretme isteği 409 dönmeli."""
        
        with db.get_conn() as conn:
            conn.execute(
                "INSERT INTO report_jobs (id, ticker, reporting_year, status, stage, progress, message, created_at, updated_at) "
                "VALUES ('test-job-123', 'TEST_CO', 2025, 'generating', 'generating', 50, 'Test', '2025-01-01', '2025-01-01')"
            )
            
        req = report.GenerateRequest(reporting_year=2025)
        bt = BackgroundTasks()
        
        with pytest.raises(HTTPException) as exc:
            report.generate_report("TEST_CO", req, bt)
            
        assert exc.value.status_code == 409

    def test_latest_report_endpoint(self, temp_db):
        """En son yayımlanmış rapor."""
        data = report.get_latest_report("TEST_CO", 2025)
        assert data["status"] == "not_found"

        with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".md") as f:
            f.write("# TEST REPORT CONTENT")
            temp_path = f.name
            
        try:
            with db.get_conn() as conn:
                conn.execute(
                    "INSERT INTO report_versions (id, ticker, reporting_year, status, markdown_path, sha256, source_fingerprint, validation_status, validation_details_json, model_provider, model_name, prompt_version, created_at, published_at) "
                    "VALUES ('v-123', 'TEST_CO', 2025, 'published', ?, 'hash-test', 'fp-test', 'passed', '{}', 'openai', 'gpt-5.4', 'v1', '2025-01-01', '2025-01-01')",
                    (temp_path,)
                )
            
            data2 = report.get_latest_report("TEST_CO", 2025)
            assert data2["status"] == "found"
            assert "TEST REPORT CONTENT" in data2["content"]
            assert data2["hash"] == "hash-test"
        finally:
            os.remove(temp_path)
