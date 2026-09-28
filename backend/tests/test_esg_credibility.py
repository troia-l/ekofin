import json
import os
import sqlite3
import tempfile
from contextlib import closing
from datetime import date
from pathlib import Path

from config import DATA_DIR
from modules.esg_credibility.deduplication import deduplicate
from modules.esg_credibility.demo_data import build_demo_snapshot
from modules.esg_credibility.evidence_analyzer import RuleBasedEvidenceAnalyzer
from modules.esg_credibility.schemas import Claim, Evidence, Relation
from modules.esg_credibility.scoring import claim_scores
import database
import pytest
from dotenv import load_dotenv
from modules.esg_credibility.evidence_analyzer import LLMEvidenceAnalyzer


def _fixture():
    return json.loads((DATA_DIR / "esg_credibility" / "tesla_demo.json").read_text(encoding="utf-8"))


def test_real_company_fixture_produces_bounded_esg_credibility():
    snapshot = build_demo_snapshot()
    assert snapshot.ticker == "TSLA"
    assert snapshot.company_name == "Tesla, Inc."
    assert snapshot.demo is True
    for pillar in ("E", "S", "G"):
        result = snapshot.pillars[pillar]
        assert 0 <= result.reliability <= 1
        assert 0 <= result.evidence_adequacy <= 1
        assert result.reliability < 0.5
        assert result.evidence
        assert all(item["url"].startswith("https://") for item in result.evidence)


def test_nlp_marks_regulatory_violation_as_contradiction():
    payload = _fixture()
    claim = Claim.model_validate(payload["claims"][0])
    evidence = Evidence.model_validate(payload["evidence"][0])
    result = RuleBasedEvidenceAnalyzer().analyze(
        claim, evidence, company_name=payload["company_name"], aliases=payload["aliases"],
        as_of=date.fromisoformat(payload["as_of"]),
    )
    assert result.relation == Relation.CONTRADICT
    assert result.entity_confidence >= 0.8
    assert result.weight > 0


def test_duplicate_syndication_is_counted_once():
    payload = _fixture()
    item = Evidence.model_validate(payload["evidence"][0])
    duplicate = item.model_copy(update={"id": "duplicate", "url": str(item.url) + "?utm_source=test"})
    assert len(deduplicate([item, duplicate])) == 1


def test_no_evidence_keeps_neutral_prior_and_zero_adequacy():
    reliability, adequacy = claim_scores([])
    assert reliability == 0.5
    assert adequacy == 0.0


def test_company_controlled_or_unknown_source_does_not_increase_score():
    payload = _fixture()
    claim = Claim.model_validate(payload["claims"][0])
    company_pr = Evidence.model_validate({
        **payload["evidence"][0],
        "id": "company_pr",
        "url": "https://www.tesla.com/example-press-release",
        "source": "Tesla",
        "body": "Tesla confirmed that its own environmental compliance is excellent.",
    })
    from modules.esg_credibility.evidence_analyzer import RuleBasedEvidenceAnalyzer
    from modules.esg_credibility.service import CredibilityService
    snapshot = CredibilityService(RuleBasedEvidenceAnalyzer()).evaluate(
        ticker="TSLA", company_name="Tesla, Inc.", aliases=["Tesla"],
        claims=[claim], evidence=[company_pr], as_of=date.fromisoformat(payload["as_of"]),
    )
    assert snapshot.pillars["E"].reliability == 0.5
    assert snapshot.pillars["E"].evidence_adequacy == 0
    assert snapshot.pillars["E"].evidence == []


def test_credibility_tables_are_created(monkeypatch):
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "credibility.db"
        monkeypatch.setattr(database, "DB_PATH", path)
        database.init_db()
        with closing(sqlite3.connect(path)) as conn:
            tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert {"credibility_snapshots", "external_evidence", "claim_evidence_links"} <= tables


@pytest.mark.skipif(os.getenv("RUN_LIVE_LLM_TESTS") != "1", reason="Opt-in canlı LLM testi")
def test_one_real_company_pair_with_live_llm():
    load_dotenv(DATA_DIR.parent / ".env")
    payload = _fixture()
    result = LLMEvidenceAnalyzer().analyze(
        Claim.model_validate(payload["claims"][0]),
        Evidence.model_validate(payload["evidence"][0]),
        company_name=payload["company_name"],
        aliases=payload["aliases"],
        as_of=date.fromisoformat(payload["as_of"]),
    )
    assert result.relation == Relation.CONTRADICT
    assert result.weight > 0
