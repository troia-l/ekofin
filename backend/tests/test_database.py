import pytest
import tempfile
from pathlib import Path
import database as db


@pytest.fixture
def temp_db(monkeypatch):
    """Testler için geçici izole SQLite veritabanı oluşturur."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_db_path = Path(tmpdir) / "test_ekofin.db"
        monkeypatch.setattr(db, "DB_PATH", tmp_db_path)
        db.init_db()
        yield tmp_db_path


class TestDatabaseOperations:
    """SQLite veritabanı ve modülasyon işlemleri testleri."""

    def test_database_initialization(self, temp_db):
        assert temp_db.exists()

    def test_add_and_list_feedback(self, temp_db):
        nlp_mock = {
            "sentiment": "Pozitif",
            "pillar": "Environmental",
            "impact_score": 0.5,
            "explanation": "Test açıklaması"
        }
        item = db.add_feedback(
            ticker="TEST_TICKER",
            user_name="Ahmet Yılmaz",
            rating=5,
            comment="Çevreye duyarlı harika bir fabrika.",
            nlp=nlp_mock
        )
        assert item["id"] is not None
        assert item["userName"] == "Ahmet Yılmaz"

        feedback_list = db.list_feedback("TEST_TICKER")
        assert len(feedback_list) == 1
        assert feedback_list[0]["userName"] == "Ahmet Yılmaz"
        assert feedback_list[0]["nlp"]["impact_score"] == 0.5

    def test_public_audits_upvote_and_status_update(self, temp_db):
        nlp_mock = {"sentiment": "Negatif", "pillar": "Environmental", "impact_score": -0.8, "explanation": "İhbar"}
        audit = db.add_audit(
            ticker="TEST_CO",
            company="Test Kimya",
            category="Atık Su",
            description="Dereye arıtılmamış su bırakılıyor.",
            nlp=nlp_mock
        )
        audit_id = audit["id"]
        assert audit["status"] == "İnceleniyor"
        assert audit["upvotes"] == 1

        # Upvote testi
        new_votes = db.upvote_audit(audit_id)
        assert new_votes == 2

        # Durum güncelleme testi
        updated = db.set_audit_status(audit_id, "Doğrulandı - Skor Düşürüldü")
        assert updated["status"] == "Doğrulandı - Skor Düşürüldü"

    def test_score_snapshot_and_history(self, temp_db):
        snap = db.upsert_score_snapshot(
            ticker="TEST_CO",
            date_str="2026-09-20",
            base_score=7.5,
            feedback_mod=0.2,
            audit_mod=-0.3,
            news_mod=0.1
        )
        assert snap["score"] == pytest.approx(7.5, rel=1e-2)

        history = db.get_score_history("TEST_CO")
        assert len(history) == 1
        assert history[0]["date"] == "2026-09-20"
        assert history[0]["score"] == snap["score"]

    def test_unverified_audit_does_not_affect_modulation(self, temp_db):
        # Durumu sadece "İnceleniyor" olan ihbarlar modülasyona girmemelidir
        nlp_mock = {"sentiment": "Negatif", "pillar": "Environmental", "impact_score": -1.0, "explanation": "İhbar"}
        db.add_audit("CLEAN_CO", "Temiz Firma", "Hava", "Şüpheli duman.", nlp=nlp_mock)
        
        # İhbar inceleniyor aşamasında olduğundan modülasyon 0.0 olmalı
        mod = db.compute_audit_modulation("CLEAN_CO")
        assert mod == 0.0
