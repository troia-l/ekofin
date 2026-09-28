from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Protocol

import database

from .schemas import CredibilitySnapshot


class CredibilityRepository(Protocol):
    def save(self, snapshot: CredibilitySnapshot) -> str: ...
    def latest(self, ticker: str) -> CredibilitySnapshot | None: ...


class SQLiteCredibilityRepository:
    """Kalıcı snapshot adaptörü; analiz servisi SQLite'a bağımlı değildir."""

    def save(self, snapshot: CredibilitySnapshot) -> str:
        snapshot_id = str(uuid.uuid4())
        with database.get_conn() as conn:
            conn.execute(
                """INSERT INTO credibility_snapshots
                   (id,ticker,company_name,methodology_version,payload_json,status,created_at)
                   VALUES(?,?,?,?,?,?,?)""",
                (
                    snapshot_id,
                    snapshot.ticker,
                    snapshot.company_name,
                    snapshot.methodology_version,
                    snapshot.model_dump_json(),
                    "experimental",
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
        return snapshot_id

    def latest(self, ticker: str) -> CredibilitySnapshot | None:
        with database.get_conn() as conn:
            row = conn.execute(
                "SELECT payload_json FROM credibility_snapshots WHERE ticker=? ORDER BY created_at DESC LIMIT 1",
                (ticker.upper(),),
            ).fetchone()
        return CredibilitySnapshot.model_validate_json(row["payload_json"]) if row else None
