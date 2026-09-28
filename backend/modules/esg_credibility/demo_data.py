from __future__ import annotations

import json
from datetime import date

from config import DATA_DIR
from .evidence_analyzer import RuleBasedEvidenceAnalyzer
from .schemas import Claim, Evidence
from .service import CredibilityService


DEMO_PATH = DATA_DIR / "esg_credibility" / "tesla_demo.json"


def build_demo_snapshot():
    payload = json.loads(DEMO_PATH.read_text(encoding="utf-8"))
    service = CredibilityService(RuleBasedEvidenceAnalyzer())
    return service.evaluate(
        ticker=payload["ticker"],
        company_name=payload["company_name"],
        aliases=payload["aliases"],
        claims=[Claim.model_validate(item) for item in payload["claims"]],
        evidence=[Evidence.model_validate(item) for item in payload["evidence"]],
        as_of=date.fromisoformat(payload["as_of"]),
        demo=True,
    )
