from __future__ import annotations

import math
from collections import defaultdict

from .schemas import Claim, EvidenceAssessment, Pillar, PillarCredibility, Relation


METHODOLOGY_VERSION = "credibility-rq-v1"


def evidence_weight(item: EvidenceAssessment) -> float:
    return max(0.0, min(1.0, (
        item.source_weight
        * item.entity_confidence
        * item.relevance_confidence
        * item.provenance
        * item.maturity
        * item.recency
    )))


def claim_scores(assessments: list[EvidenceAssessment]) -> tuple[float, float]:
    weighted_support = sum(item.weight for item in assessments if item.relation == Relation.SUPPORT)
    weighted_contradiction = sum(item.weight for item in assessments if item.relation == Relation.CONTRADICT)
    total_weight = sum(item.weight for item in assessments)
    reliability = (2.0 + weighted_support) / (4.0 + weighted_support + weighted_contradiction)
    adequacy = 1.0 - math.exp(-total_weight / 2.0)
    return reliability, adequacy


def aggregate_pillars(
    claims: list[Claim],
    assessments: list[EvidenceAssessment],
    evidence_details: dict[str, dict],
) -> dict[str, PillarCredibility]:
    by_claim: dict[str, list[EvidenceAssessment]] = defaultdict(list)
    for item in assessments:
        by_claim[item.claim_id].append(item)

    result: dict[str, PillarCredibility] = {}
    for pillar in Pillar:
        pillar_claims = [claim for claim in claims if claim.pillar == pillar]
        numerator = denominator = adequacy_sum = 0.0
        negative_sources: list[dict] = []
        for claim in pillar_claims:
            related = by_claim.get(claim.id, [])
            reliability, adequacy = claim_scores(related)
            effective = claim.materiality * max(adequacy, 0.01)
            numerator += reliability * effective
            denominator += effective
            adequacy_sum += adequacy * claim.materiality
            for item in related:
                if item.relation == Relation.CONTRADICT:
                    negative_sources.append({
                        **evidence_details[item.evidence_id],
                        "claim": claim.text,
                        "weight": round(item.weight, 4),
                        "explanation": item.explanation,
                    })
        reliability = numerator / denominator if denominator else 0.5
        max_materiality = sum(claim.materiality for claim in pillar_claims)
        adequacy = adequacy_sum / max_materiality if max_materiality else 0.0
        status = "insufficient_evidence" if adequacy < 0.2 else "experimental"
        reason = (
            f"{len(negative_sources)} karşıt kanıt bulundu; kapsam sınırlı olduğundan sonuç nötr öncüle yakın tutuldu."
            if status == "insufficient_evidence" and negative_sources
            else "Bağımsız kanıt kapsamı yetersiz; %50 nötr öncül korunur."
            if status == "insufficient_evidence"
            else f"{len(negative_sources)} karşıt dış kanıt güvenilirlik oranını düşürdü."
        )
        result[pillar.value] = PillarCredibility(
            pillar=pillar,
            reliability=round(reliability, 4),
            evidence_adequacy=round(adequacy, 4),
            status=status,
            reason=reason,
            evidence=negative_sources,
        )
    return result
