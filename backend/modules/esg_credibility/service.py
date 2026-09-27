from __future__ import annotations

from datetime import date, datetime, timezone

from .deduplication import deduplicate
from .evidence_analyzer import EvidenceAnalyzer
from .schemas import Claim, CredibilitySnapshot, Evidence
from .scoring import METHODOLOGY_VERSION, aggregate_pillars
from .source_policy import SourcePolicy


class CredibilityService:
    def __init__(self, analyzer: EvidenceAnalyzer, source_policy: SourcePolicy | None = None):
        self.analyzer = analyzer
        self.source_policy = source_policy or SourcePolicy()

    def evaluate(
        self,
        *,
        ticker: str,
        company_name: str,
        aliases: list[str],
        claims: list[Claim],
        evidence: list[Evidence],
        as_of: date | None = None,
        demo: bool = False,
    ) -> CredibilitySnapshot:
        reference_date = as_of or date.today()
        eligible = [item for item in deduplicate(evidence) if self.source_policy.is_allowed(str(item.url)) and item.body.strip()]
        assessments = []
        details = {}
        for item in eligible:
            details[item.id] = {
                "id": item.id,
                "title": item.title,
                "source": item.source,
                "url": str(item.url),
                "published_date": item.published_date.isoformat(),
                "topic": item.topic,
            }
            for claim in claims:
                if claim.pillar == item.pillar:
                    assessments.append(self.analyzer.analyze(
                        claim, item, company_name=company_name, aliases=aliases, as_of=reference_date
                    ))
        pillars = aggregate_pillars(claims, assessments, details)
        return CredibilitySnapshot(
            ticker=ticker.upper(),
            company_name=company_name,
            methodology_version=f"{METHODOLOGY_VERSION}+{self.source_policy.version}",
            demo=demo,
            generated_at=datetime.now(timezone.utc).isoformat(),
            pillars=pillars,
        )
