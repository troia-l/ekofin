"""
ESG Skor Tahmini, Model Kartı, TreeSHAP Açıklanabilirlik, Geri Bildirim ve Haberler Router'ı
"""

import csv
import json
from datetime import datetime

from fastapi import APIRouter, HTTPException

from config import BASE_DIR, DATA_DIR
import database as db
from .common import (
    COMPANY_DETAILS,
    FeedbackSubmit,
    _get_esg_predictor,
    _ensure_fresh_news,
    _fetch_and_store_news,
    _run_nlp,
    _company_name,
    get_cover_image,
    generate_ai_insights,
)

router = APIRouter(tags=["ESG Prediction & Analytics"])


@router.get("/api/esg/model-card")
def get_model_card():
    """Google Model Cards standardında model kimlik kartını ve akademik metrikleri döner."""
    card_path = BASE_DIR / "data" / "model_card.json"
    if not card_path.exists():
        raise HTTPException(status_code=404, detail="Model kartı bulunamadı.")
    with open(card_path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/api/esg/explain/{ticker}")
def explain_esg_score(ticker: str):
    """Şirketin XGBoost ESG skorunu TreeSHAP ile yerel öznitelik katkılarına ayrıştırır."""
    from modules.esg_prediction.kap_loader import get_kap_features_for_ticker
    predictor = _get_esg_predictor()
    features = get_kap_features_for_ticker(ticker)
    return predictor.explain(features)


@router.get("/api/esg/companies")
def get_esg_companies():
    """esg_tahmin.csv dosyasından verileri oku ve şirket verileriyle birleştirerek döndür."""
    csv_path = DATA_DIR / "esg_tahmin.csv"
    
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="ESG tahmin veritabanı (esg_tahmin.csv) bulunamadı.")
        
    companies = []
    today_str = datetime.now().strftime("%Y-%m-%d")
    try:
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            # Tarihler 1. kolondan sonrasıdır.
            dates = header[1:]

            for row in reader:
                if not row:
                    continue
                ticker = row[0]
                # En son tahmin edilen skor satırın son değeridir.
                raw_score = float(row[-1])
                score_out_of_10 = round(raw_score / 10.0, 1)

                # Toplumsal (yorum + doğrulanmış ihbar + haber) modülasyonu decay ağırlıklı hesapla
                feedback_mod = db.compute_feedback_modulation(ticker)
                audit_mod = db.compute_audit_modulation(ticker)
                news_mod = db.compute_news_modulation(ticker)

                # Bugünün snapshot'ı yoksa yaz (günlük skor geçmişi için idempotent)
                snapshot = db.upsert_score_snapshot(ticker, today_str, score_out_of_10, feedback_mod, audit_mod, news_mod)
                dynamic_score = snapshot["score"]
                total_modulation = round(feedback_mod + audit_mod + news_mod, 2)

                # 7 gün önceki skora göre gerçek artış/azalış delta'sı
                week_ago = db.get_snapshot_n_days_ago(ticker, 7)
                delta_7d = round(dynamic_score - week_ago["score"], 2) if week_ago else 0.0

                # Dinamik risk seviyesi belirleme (dinamik skora göre)
                dynamic_raw_score = dynamic_score * 10.0
                if dynamic_raw_score >= 80:
                    risk_level = "Düşük"
                elif dynamic_raw_score >= 50:
                    risk_level = "Orta"
                else:
                    risk_level = "Yüksek"

                # Eşlemelerden detaylar alınır
                details = COMPANY_DETAILS.get(ticker, {
                    "name": f"{ticker} Ticaret A.Ş.",
                    "sector": "Genel Sektör",
                    "domain": "",
                    "verified": ["Yıllık ESG raporlama uyumu", "Çevresel beyanlar doğrulanmıştır"]
                })

                # Grafik için geçmiş tahmin serisi (CSV) + gerçek günlük skor geçmişi (SQLite)
                score_history = []
                for i, date in enumerate(dates):
                    try:
                        score_history.append({
                            "date": date,
                            "score": round(float(row[i+1]) / 10.0, 1)
                        })
                    except:
                        pass

                daily_history = db.get_score_history(ticker)
                score_history.extend(daily_history)

                companies.append({
                    "ticker": ticker,
                    "name": details["name"],
                    "sector": details["sector"],
                    "domain": details["domain"],
                    "score": dynamic_score,
                    "baseScore": score_out_of_10,
                    "modulation": total_modulation,
                    "delta7d": delta_7d,
                    "riskLevel": risk_level,
                    "coverImage": get_cover_image(details["sector"]),
                    "aiInsights": generate_ai_insights(ticker, details["name"], dynamic_score),
                    "verifiedPoints": details["verified"],
                    "scoreHistory": score_history
                })
    except Exception as e:
        print(f"[HATA] esg_tahmin.csv okunurken hata oluştu: {e}")
        raise HTTPException(status_code=500, detail=f"CSV dosyası okunamadı: {str(e)}")

    return companies


@router.post("/api/esg/predict")
def predict_esg(data: dict):
    """ESG Overall skorunu tahmin et."""
    try:
        from modules.esg_prediction.predictor import CompanyFeatures
        predictor = _get_esg_predictor()
        features = CompanyFeatures(**data)
        result = predictor.predict(features)
        return result.model_dump()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"ESG modeli yüklenemedi: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/esg/health")
def esg_health():
    """ESG model sağlık kontrolü."""
    try:
        predictor = _get_esg_predictor()
        return {
            "status": "ok",
            "model_version": "1.0.0",
            "n_features": len(predictor.features)
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@router.get("/api/esg/feedback/{ticker}")
def get_company_feedback(ticker: str):
    """Belirli bir şirket için yapılan geri bildirimleri getir."""
    return db.list_feedback(ticker)


@router.post("/api/esg/feedback/{ticker}")
def add_company_feedback(ticker: str, data: FeedbackSubmit):
    """Belirli bir şirket için geri bildirim ekle (NLP analizinden geçirilip skor modülasyonuna dahil edilir)."""
    nlp_result = _run_nlp(data.comment)
    new_item = db.add_feedback(ticker, data.userName.strip(), data.rating, data.comment.strip(), nlp_result)
    return {"status": "success", "message": "Geri bildirim başarıyla kaydedildi.", "feedback": new_item}


@router.get("/api/esg/score-history/{ticker}")
def get_company_score_history(ticker: str):
    """Şirketin gerçek tarihli günlük ESG skor geçmişini ve son 7/30 gün delta'sını döndürür."""
    history = db.get_score_history(ticker)
    latest = db.get_latest_snapshot(ticker)
    week_ago = db.get_snapshot_n_days_ago(ticker, 7)
    month_ago = db.get_snapshot_n_days_ago(ticker, 30)
    return {
        "ticker": ticker.upper(),
        "history": history,
        "current": latest,
        "delta7d": round(latest["score"] - week_ago["score"], 2) if (latest and week_ago) else 0.0,
        "delta30d": round(latest["score"] - month_ago["score"], 2) if (latest and month_ago) else 0.0,
    }


@router.get("/api/esg/news/{ticker}")
def get_company_news(ticker: str):
    """Şirketle ilgili güvenilir kaynaklardan (Google News RSS, whitelist filtreli) çekilen
    haberleri, her birinin NLP analizi ve ESG skor etkisiyle birlikte döner."""
    _ensure_fresh_news(ticker, _company_name(ticker))
    return db.list_news(ticker)


@router.post("/api/esg/news/{ticker}/refresh")
def refresh_company_news(ticker: str):
    """Haber önbelleğini yaş sınırını yok sayarak zorla yeniler (manuel tetikleme).
    Sadece yeni (henüz kayıtlı olmayan) haberler analiz edilir."""
    try:
        added, fetched = _fetch_and_store_news(ticker, _company_name(ticker))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Haber servisi şu anda ulaşılamıyor: {e}")
    return {"status": "success", "fetched": fetched, "added": added, "news": db.list_news(ticker)}
