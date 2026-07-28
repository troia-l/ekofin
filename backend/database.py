"""
EkoFin ESG Veritabanı Katmanı — SQLite
Şirket yorumları, toplumsal denetim ihbarları ve günlük ESG skor geçmişini saklar.
"""

import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Optional

from config import DATA_DIR

DB_PATH = DATA_DIR / "ekofin.db"

# Doğrulanmamış/incelenen ihbarlar skoru etkilemez — sadece bu status skor hesaplamasına dahil edilir
VERIFIED_STATUSES = {"Doğrulandı", "Doğrulandı - Skor Düşürüldü", "Doğrulandı - Acil Bildirim"}


@contextmanager
def get_conn():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS esg_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                user_name TEXT NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT NOT NULL,
                created_at TEXT NOT NULL,
                sentiment TEXT NOT NULL,
                pillar TEXT NOT NULL,
                impact_score REAL NOT NULL,
                explanation TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_feedback_ticker ON esg_feedback(ticker)")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS public_audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT,
                company TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                upvotes INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'İnceleniyor',
                sentiment TEXT,
                pillar TEXT,
                impact_score REAL,
                explanation TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_audits_ticker ON public_audits(ticker)")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS esg_score_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                date TEXT NOT NULL,
                base_score REAL NOT NULL,
                feedback_mod REAL NOT NULL,
                audit_mod REAL NOT NULL,
                news_mod REAL NOT NULL DEFAULT 0,
                final_score REAL NOT NULL,
                UNIQUE(ticker, date)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_history_ticker_date ON esg_score_history(ticker, date)")
        # Var olan eski DB dosyalarında news_mod kolonu olmayabilir — idempotent ekleme
        existing_cols = {row["name"] for row in conn.execute("PRAGMA table_info(esg_score_history)").fetchall()}
        if "news_mod" not in existing_cols:
            conn.execute("ALTER TABLE esg_score_history ADD COLUMN news_mod REAL NOT NULL DEFAULT 0")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS esg_news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                title TEXT NOT NULL,
                source TEXT NOT NULL,
                url TEXT NOT NULL,
                published_date TEXT,
                fetched_at TEXT NOT NULL,
                sentiment TEXT NOT NULL,
                pillar TEXT NOT NULL,
                impact_score REAL NOT NULL,
                explanation TEXT NOT NULL,
                UNIQUE(ticker, url)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_news_ticker ON esg_news(ticker)")


# ── Feedback (kullanıcı yorumları) ──────────────────────────────────────────

def list_feedback(ticker: str) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM esg_feedback WHERE ticker = ? ORDER BY created_at DESC, id DESC",
            (ticker.upper(),)
        ).fetchall()
        return [_feedback_row_to_dict(r) for r in rows]


def add_feedback(ticker: str, user_name: str, rating: int, comment: str, nlp: dict) -> dict:
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO esg_feedback
               (ticker, user_name, rating, comment, created_at, sentiment, pillar, impact_score, explanation)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (ticker.upper(), user_name, rating, comment, created_at,
             nlp.get("sentiment", "Nötr"), nlp.get("pillar", "Environmental"),
             float(nlp.get("impact_score", 0.0)), nlp.get("explanation", ""))
        )
        row = conn.execute("SELECT * FROM esg_feedback WHERE id = ?", (cur.lastrowid,)).fetchone()
        return _feedback_row_to_dict(row)


def _feedback_row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "userName": row["user_name"],
        "rating": row["rating"],
        "comment": row["comment"],
        "date": row["created_at"],
        "nlp": {
            "sentiment": row["sentiment"],
            "pillar": row["pillar"],
            "impact_score": row["impact_score"],
            "explanation": row["explanation"],
        }
    }


# ── Public Audits (toplumsal denetim ihbarları) ─────────────────────────────

def list_audits(ticker: Optional[str] = None) -> list:
    with get_conn() as conn:
        if ticker:
            rows = conn.execute(
                "SELECT * FROM public_audits WHERE ticker = ? ORDER BY id DESC",
                (ticker.upper(),)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM public_audits ORDER BY id DESC").fetchall()
        return [_audit_row_to_dict(r) for r in rows]


def add_audit(ticker: Optional[str], company: str, category: str, description: str, nlp: dict) -> dict:
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_conn() as conn:
        cur = conn.execute(
            """INSERT INTO public_audits
               (ticker, company, category, description, upvotes, status, sentiment, pillar, impact_score, explanation, created_at)
               VALUES (?, ?, ?, ?, 1, 'İnceleniyor', ?, ?, ?, ?, ?)""",
            (ticker.upper() if ticker else None, company, category, description,
             nlp.get("sentiment", "Nötr"), nlp.get("pillar", "Governance"),
             float(nlp.get("impact_score", 0.0)), nlp.get("explanation", ""), created_at)
        )
        row = conn.execute("SELECT * FROM public_audits WHERE id = ?", (cur.lastrowid,)).fetchone()
        return _audit_row_to_dict(row)


def upvote_audit(audit_id: int) -> int:
    with get_conn() as conn:
        row = conn.execute("SELECT upvotes FROM public_audits WHERE id = ?", (audit_id,)).fetchone()
        if row is None:
            raise KeyError("audit not found")
        new_count = row["upvotes"] + 1
        conn.execute("UPDATE public_audits SET upvotes = ? WHERE id = ?", (new_count, audit_id))
        return new_count


def set_audit_status(audit_id: int, status: str) -> dict:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM public_audits WHERE id = ?", (audit_id,)).fetchone()
        if row is None:
            raise KeyError("audit not found")
        conn.execute("UPDATE public_audits SET status = ? WHERE id = ?", (status, audit_id))
        row = conn.execute("SELECT * FROM public_audits WHERE id = ?", (audit_id,)).fetchone()
        return _audit_row_to_dict(row)


def _audit_row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "ticker": row["ticker"],
        "company": row["company"],
        "category": row["category"],
        "description": row["description"],
        "upvotes": row["upvotes"],
        "status": row["status"],
        "date": row["created_at"],
        "nlp": {
            "sentiment": row["sentiment"],
            "pillar": row["pillar"],
            "impact_score": row["impact_score"],
            "explanation": row["explanation"],
        } if row["sentiment"] else None
    }


# ── ESG Haberleri (Google News RSS) ─────────────────────────────────────────

def list_news(ticker: str, limit: int = 30) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT * FROM esg_news WHERE ticker = ?
               ORDER BY COALESCE(published_date, fetched_at) DESC LIMIT ?""",
            (ticker.upper(), limit)
        ).fetchall()
        return [_news_row_to_dict(r) for r in rows]


def get_existing_news_urls(ticker: str) -> set:
    with get_conn() as conn:
        rows = conn.execute("SELECT url FROM esg_news WHERE ticker = ?", (ticker.upper(),)).fetchall()
        return {r["url"] for r in rows}


def add_news_items(items: list) -> int:
    """Haberleri ekler; aynı (ticker, url) zaten varsa atlar (dedup). Eklenen sayıyı döner.
    Her item'ın 'nlp' alanı (sentiment/pillar/impact_score/explanation) doldurulmuş olmalıdır —
    bu fonksiyon analiz yapmaz, sadece kaydeder (bkz. api.py: _ensure_fresh_news)."""
    fetched_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    added = 0
    with get_conn() as conn:
        for item in items:
            nlp = item.get("nlp", {})
            try:
                conn.execute(
                    """INSERT INTO esg_news
                       (ticker, title, source, url, published_date, fetched_at, sentiment, pillar, impact_score, explanation)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (item["ticker"], item["title"], item["source"], item["url"], item.get("published_date"),
                     fetched_at, nlp.get("sentiment", "Nötr"), nlp.get("pillar", "Environmental"),
                     float(nlp.get("impact_score", 0.0)), nlp.get("explanation", ""))
                )
                added += 1
            except sqlite3.IntegrityError:
                continue  # bu (ticker, url) zaten kayıtlı
    return added


def get_last_news_fetch(ticker: str) -> Optional[str]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT MAX(fetched_at) as last_fetch FROM esg_news WHERE ticker = ?",
            (ticker.upper(),)
        ).fetchone()
        return row["last_fetch"] if row else None


def _news_row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "ticker": row["ticker"],
        "title": row["title"],
        "source": row["source"],
        "url": row["url"],
        "publishedDate": row["published_date"],
        "fetchedAt": row["fetched_at"],
        "nlp": {
            "sentiment": row["sentiment"],
            "pillar": row["pillar"],
            "impact_score": row["impact_score"],
            "explanation": row["explanation"],
        }
    }


def compute_news_modulation(ticker: str, as_of: Optional[datetime] = None) -> float:
    """Haberlerin skor etkisi, yayın tarihine göre decay ağırlıklı (14 gün yarı ömür)."""
    as_of = as_of or datetime.now()
    total = 0.0
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT published_date, fetched_at, impact_score FROM esg_news WHERE ticker = ?",
            (ticker.upper(),)
        ).fetchall()
    for row in rows:
        date_str = row["published_date"] or row["fetched_at"]
        try:
            item_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        except (ValueError, TypeError):
            continue
        if item_date > as_of:
            continue
        total += row["impact_score"] * _decay_weight(item_date, as_of)
    return total


# ── Skor Modülasyonu (decay ağırlıklı) ──────────────────────────────────────

def _decay_weight(item_date: datetime, as_of: datetime, half_life_days: float = 14.0) -> float:
    """Eski geri bildirim/ihbarların etkisi zamanla yarı ömür kuralına göre azalır."""
    age_days = max(0.0, (as_of - item_date).total_seconds() / 86400.0)
    return 0.5 ** (age_days / half_life_days)


def compute_feedback_modulation(ticker: str, as_of: Optional[datetime] = None) -> float:
    as_of = as_of or datetime.now()
    total = 0.0
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT created_at, impact_score FROM esg_feedback WHERE ticker = ?",
            (ticker.upper(),)
        ).fetchall()
    for row in rows:
        try:
            item_date = datetime.strptime(row["created_at"], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
        if item_date > as_of:
            continue
        total += row["impact_score"] * _decay_weight(item_date, as_of)
    return total


def compute_audit_modulation(ticker: str, as_of: Optional[datetime] = None) -> float:
    """Sadece 'Doğrulandı' statüsündeki ihbarlar skoru etkiler (manipülasyona karşı önlem)."""
    as_of = as_of or datetime.now()
    total = 0.0
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT status, impact_score FROM public_audits WHERE ticker = ? AND impact_score IS NOT NULL",
            (ticker.upper(),)
        ).fetchall()
    for row in rows:
        if row["status"] not in VERIFIED_STATUSES:
            continue
        # Doğrulanmış (resmi tutanağa bağlanmış) bir ihlal, sıradan bir yorum/haber gibi
        # zamanla "unutulmamalı" — bilinçli olarak decay uygulanmadan tam ağırlıkla sayılır.
        total += row["impact_score"]
    return total


# ── Günlük Skor Geçmişi ─────────────────────────────────────────────────────

def upsert_score_snapshot(ticker: str, date_str: str, base_score: float, feedback_mod: float,
                           audit_mod: float, news_mod: float = 0.0) -> dict:
    final_score = round(max(0.0, min(10.0, base_score + feedback_mod + audit_mod + news_mod)), 2)
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO esg_score_history (ticker, date, base_score, feedback_mod, audit_mod, news_mod, final_score)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(ticker, date) DO UPDATE SET
                 base_score=excluded.base_score,
                 feedback_mod=excluded.feedback_mod,
                 audit_mod=excluded.audit_mod,
                 news_mod=excluded.news_mod,
                 final_score=excluded.final_score""",
            (ticker.upper(), date_str, base_score, feedback_mod, audit_mod, news_mod, final_score)
        )
    return {"ticker": ticker.upper(), "date": date_str, "baseScore": base_score,
            "feedbackMod": round(feedback_mod, 2), "auditMod": round(audit_mod, 2),
            "newsMod": round(news_mod, 2), "score": final_score}


def get_score_history(ticker: str, limit_days: int = 90) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT date, final_score FROM esg_score_history
               WHERE ticker = ? ORDER BY date ASC LIMIT ?""",
            (ticker.upper(), limit_days)
        ).fetchall()
        return [{"date": r["date"], "score": r["final_score"]} for r in rows]


def get_latest_snapshot(ticker: str) -> Optional[dict]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM esg_score_history WHERE ticker = ? ORDER BY date DESC LIMIT 1",
            (ticker.upper(),)
        ).fetchone()
        if row is None:
            return None
        return {"date": row["date"], "baseScore": row["base_score"], "feedbackMod": row["feedback_mod"],
                "auditMod": row["audit_mod"], "score": row["final_score"]}


def get_snapshot_n_days_ago(ticker: str, n: int) -> Optional[dict]:
    """Son N gün önceki (veya ondan en yakın önceki) skoru döner — delta hesabı için."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT date, final_score FROM esg_score_history WHERE ticker = ? ORDER BY date ASC",
            (ticker.upper(),)
        ).fetchall()
    if not rows:
        return None
    today = datetime.now().date()
    target = today.toordinal() - n
    best = None
    for r in rows:
        try:
            d = datetime.strptime(r["date"], "%Y-%m-%d").date()
        except ValueError:
            continue
        if d.toordinal() <= target:
            best = r
        else:
            break
    if best is None:
        best = rows[0]
    return {"date": best["date"], "score": best["final_score"]}
