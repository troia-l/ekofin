"""
Tek seferlik migration: esg_feedback.json / public_audits.json (mockup, kısmen
uydurma "haber gibi giydirilmiş yorum" verisi içeriyordu) yerine gerçek şirket
yorumu görünümünde temiz bir seed ile SQLite'a (ekofin.db) geçiş yapar.

Çalıştırma:
    cd backend && python scripts/migrate_json_to_sqlite.py
"""

import csv
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

from config import DATA_DIR
import database as db
from modules.esg_prediction.nlp_analyzer import ESGCommentAnalyzer

# nlp alanı burada YOK — gerçek analiz aşağıda ESGCommentAnalyzer ile çalışma anında yapılır.
FEEDBACK_SEED = {
    "ASELS": [
        {"userName": "Elif K.", "rating": 5, "comment": "Fabrika ziyaretinde gördüğüm enerji verimliliği yatırımları (LED aydınlatma, güneş paneli) gerçekten etkileyiciydi."},
        {"userName": "Serkan T.", "rating": 3, "comment": "Yıllık sürdürülebilirlik raporu hazırlanıyor ama geçen yılın verileriyle karşılaştırmalı tablo eksik, takibi zorlaştırıyor."},
    ],
    "ZOREN": [
        {"userName": "Kaan Aydın", "rating": 5, "comment": "Yenilenebilir rüzgar ve jeotermal enerjideki öncülüğünü destekliyorum. Elektrikli araç şarj ağı (ZES) harika bir yatırım."},
        {"userName": "Derya Ş.", "rating": 2, "comment": "OEDAŞ bölgesinde son bir ayda 3 kez plansız elektrik kesintisi yaşadık, müşteri hizmetlerine ulaşmak da zor."},
    ],
    "THYAO": [
        {"userName": "Burak Kaya", "rating": 4, "comment": "Filo gençleştirme ve sürdürülebilir uçak yakıtı (SAF) kullanımı olumlu adımlar."},
        {"userName": "Gizem A.", "rating": 2, "comment": "Karbon dengeleme programının (CO2mission) gerçek etkisi hakkında yeterli bağımsız denetim verisi paylaşılmıyor."},
    ],
}

AUDIT_SEED = [
    {"ticker": "EREGL", "company": "Ereğli Demir Çelik", "category": "Hava Kirliliği",
     "description": "Yüksek fırın bacalarından gece saatlerinde yoğun duman salınımı gözlemlendi, filtre sisteminin gündüz çalışıp gece kapatıldığından şüpheleniliyor.",
     "status": "İnceleniyor", "upvotes": 34},
    {"ticker": "SASA", "company": "Sasa Polyester", "category": "Atık Su Deşarjı",
     "description": "Bağımsız çevre denetim raporunda arıtma tesisi çıkış suyunda mevzuat limitini aşan kimyasal atık tespit edildi ve resmi tutanağa bağlandı.",
     "status": "Doğrulandı - Skor Düşürüldü", "upvotes": 128},
    {"ticker": "THYAO", "company": "Türk Hava Yolları", "category": "Yeşil Aklama (Greenwashing)",
     "description": "Karbon nötr iddialarının dayandığı ofset projelerinin üçüncü taraf sertifikasyonu kamuoyuyla paylaşılmıyor.",
     "status": "İnceleniyor", "upvotes": 19},
]


def _load_base_scores() -> dict:
    csv_path = DATA_DIR / "esg_tahmin.csv"
    scores = {}
    if not csv_path.exists():
        return scores
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if not row:
                continue
            scores[row[0].upper()] = round(float(row[-1]) / 10.0, 1)
    return scores


def main():
    db.init_db()
    base_scores = _load_base_scores()
    analyzer = ESGCommentAnalyzer()
    print(f"NLP sağlayıcı durumu: openai={analyzer.openai_chain is not None} gemini={analyzer.gemini_chain is not None}")

    print("Feedback seed yazılıyor (gerçek LLM analiziyle)...")
    now = datetime.now()
    for ticker, items in FEEDBACK_SEED.items():
        for i, item in enumerate(items):
            created_at = (now - timedelta(days=2 + i * 3)).strftime("%Y-%m-%d %H:%M:%S")
            nlp = analyzer.analyze(item["comment"])
            print(f"  [{ticker}] {item['comment'][:40]}... -> {nlp['sentiment']}/{nlp['pillar']}/{nlp['impact_score']}")
            with db.get_conn() as conn:
                conn.execute(
                    """INSERT INTO esg_feedback
                       (ticker, user_name, rating, comment, created_at, sentiment, pillar, impact_score, explanation)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (ticker, item["userName"], item["rating"], item["comment"], created_at,
                     nlp["sentiment"], nlp["pillar"], nlp["impact_score"], nlp["explanation"])
                )

    print("Toplumsal denetim (public audit) seed yazılıyor (gerçek LLM analiziyle)...")
    audit_created_at = (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")
    for item in AUDIT_SEED:
        nlp = analyzer.analyze(item["description"])
        print(f"  [{item['ticker']}] {item['description'][:40]}... -> {nlp['sentiment']}/{nlp['pillar']}/{nlp['impact_score']}")
        with db.get_conn() as conn:
            conn.execute(
                """INSERT INTO public_audits
                   (ticker, company, category, description, upvotes, status, sentiment, pillar, impact_score, explanation, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (item["ticker"], item["company"], item["category"], item["description"],
                 item["upvotes"], item["status"], nlp["sentiment"], nlp["pillar"],
                 nlp["impact_score"], nlp["explanation"], audit_created_at)
            )

    print("Son 7 günlük skor geçmişi (trend göstermek için) geriye dönük yazılıyor...")
    seeded_tickers = set(FEEDBACK_SEED.keys()) | {a["ticker"] for a in AUDIT_SEED}
    today = now.date()
    for ticker in seeded_tickers:
        base = base_scores.get(ticker)
        if base is None:
            continue
        for days_ago in range(7, 0, -1):
            date_str = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            db.upsert_score_snapshot(ticker, date_str, base_score=base, feedback_mod=0.0, audit_mod=0.0)

    print("Bugünün gerçek (feedback+audit modülasyonlu) snapshot'ı yazılıyor...")
    for ticker in seeded_tickers:
        base = base_scores.get(ticker)
        if base is None:
            continue
        fmod = db.compute_feedback_modulation(ticker)
        amod = db.compute_audit_modulation(ticker)
        snap = db.upsert_score_snapshot(ticker, today.strftime("%Y-%m-%d"), base_score=base, feedback_mod=fmod, audit_mod=amod)
        print(f"  {ticker}: base={base} feedback_mod={fmod:.2f} audit_mod={amod:.2f} -> {snap['score']}")

    print(f"Migration tamamlandı. DB: {db.DB_PATH}")


if __name__ == "__main__":
    main()
