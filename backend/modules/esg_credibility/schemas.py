from __future__ import annotations

from datetime import date
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl


class Pillar(str, Enum):
    E = "E"
    S = "S"
    G = "G"


class Relation(str, Enum):
    SUPPORT = "support"
    CONTRADICT = "contradict"
    UNCLEAR = "unclear"


class Claim(BaseModel):
    id: str
    text: str
    pillar: Pillar
    topic: str
    materiality: float = Field(default=1.0, ge=0, le=1)
    source_kind: str = "self_declared"


class Evidence(BaseModel):
    id: str
    title: str
    source: str
    url: HttpUrl
    published_date: date
    body: str
    pillar: Pillar
    topic: str
    source_kind: str
    provenance: float = Field(default=1.0, ge=0, le=1)
    maturity: float = Field(default=1.0, ge=0, le=1)


class EvidenceAssessment(BaseModel):
    claim_id: str
    evidence_id: str
    pillar: Pillar
    topic: str
    relation: Relation
    entity_confidence: float = Field(ge=0, le=1)
    relevance_confidence: float = Field(ge=0, le=1)
    source_weight: float = Field(ge=0, le=1)
    provenance: float = Field(ge=0, le=1)
    maturity: float = Field(ge=0, le=1)
    recency: float = Field(ge=0, le=1)
    weight: float = Field(ge=0, le=1)
    explanation: str


class PillarCredibility(BaseModel):
    pillar: Pillar
    reliability: float = Field(ge=0, le=1)
    evidence_adequacy: float = Field(ge=0, le=1)
    status: str
    reason: str
    evidence: list[dict]


class CredibilitySnapshot(BaseModel):
    ticker: str
    company_name: str
    methodology_version: str
    experimental: bool = True
    demo: bool = False
    generated_at: str
    pillars: dict[str, PillarCredibility]
