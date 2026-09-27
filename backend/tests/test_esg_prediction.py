import pytest
from modules.esg_prediction.predictor import CompanyFeatures, PredictionResponse, ESGPredictor
from modules.esg_prediction.nlp_analyzer import ESGAnalysisResult, ESGCommentAnalyzer


class TestESGPredictor:
    """XGBoost ESG tahmin motoru ve veri doğrulama testleri."""

    def test_company_features_validation(self):
        features = CompanyFeatures(
            Revenue=1000.0,
            ProfitMargin=15.0,
            MarketCap=5000.0,
            GrowthRate=10.0,
            CarbonEmissions=250.0,
            WaterUsage=100.0,
            EnergyConsumption=400.0,
            Industry="Manufacturing",
            Region="Europe",
            Year=2024
        )
        assert features.Revenue == 1000.0
        assert features.Industry == "Manufacturing"
        assert features.Revenue_yoy is None  # Optional field defaults to None

    def test_predictor_model_inference_or_fallback(self):
        try:
            predictor = ESGPredictor()
            features = CompanyFeatures(
                Revenue=1200.0,
                ProfitMargin=12.5,
                MarketCap=4500.0,
                GrowthRate=8.0,
                CarbonEmissions=300.0,
                WaterUsage=150.0,
                EnergyConsumption=500.0,
                Industry="Technology",
                Region="North America",
                Year=2024
            )
            res = predictor.predict(features)
            assert isinstance(res, PredictionResponse)
            assert 0.0 <= res.predicted_esg_overall <= 100.0
            assert res.confidence_note != ""
        except FileNotFoundError:
            # Model dosyaları eksikse FileNotFound fırlatması beklenen davranıştır
            pytest.skip("esg_model_trackB.pkl yerel ortamda bulunamadı.")

    def test_predictor_explain(self):
        try:
            predictor = ESGPredictor()
            features = CompanyFeatures(
                Revenue=1200.0, ProfitMargin=12.5, MarketCap=4500.0, GrowthRate=8.0,
                CarbonEmissions=300.0, WaterUsage=150.0, EnergyConsumption=500.0,
                Industry="Technology", Region="North America", Year=2024
            )
            res = predictor.explain(features)
            assert "base_value" in res
            assert "predicted_score" in res
            assert "top_contributions" in res
            assert isinstance(res["top_contributions"], list)
        except FileNotFoundError:
            pytest.skip("esg_model_trackB.pkl yerel ortamda bulunamadı.")


class TestKAPLoader:
    """KAP Veri Adaptörü (kap_loader) testleri."""
    def test_kap_loader_fallback(self):
        from modules.esg_prediction.kap_loader import get_kap_features_for_ticker
        features = get_kap_features_for_ticker("UNKNOWN_TICKER")
        assert isinstance(features, CompanyFeatures)
        assert features.Revenue > 0
        assert features.Industry == "Manufacturing"

    def test_asels_and_zoren_produce_distinct_profiles_and_scores(self):
        from modules.esg_prediction.kap_loader import get_kap_features_for_ticker
        from modules.esg_prediction.predictor import ESGPredictor
        from config import DATA_DIR
        
        asels_feat = get_kap_features_for_ticker("ASELS")
        zoren_feat = get_kap_features_for_ticker("ZOREN")
        
        # Profiller farklı olmalı
        assert asels_feat.Industry == "Technology"
        assert zoren_feat.Industry == "Utilities"
        assert asels_feat.Revenue != zoren_feat.Revenue
        assert asels_feat.EnergyConsumption != zoren_feat.EnergyConsumption
        
        # Model tahminleri ve TreeSHAP farklı olmalı
        predictor = ESGPredictor()
        asels_res = predictor.explain(asels_feat)
        zoren_res = predictor.explain(zoren_feat)
        
        assert asels_res["predicted_score"] != zoren_res["predicted_score"]
        assert asels_res["predicted_score"] == 38.52
        assert zoren_res["predicted_score"] == 46.34
        
    def test_auto_context_fallback(self):
        # We test the fallback generation logic if no Gemini API Key is present
        from api import get_simulator_auto_context
        import os
        # Temporarily unset API key to guarantee fallback logic execution
        original_key = os.environ.get("GEMINI_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
            
        res = get_simulator_auto_context("ASELS")
        assert "context" in res
        assert "ASELS" in res["context"]
        assert "sektöründe faaliyet göstermektedir" in res["context"]
        assert "suggested_investments" in res
        assert "current_status" in res
        assert "llm_recommendation" in res
        
        # Restore API key
        if original_key is not None:
            os.environ["GEMINI_API_KEY"] = original_key


class TestNLPCommentAnalyzer:
    """NLP duygu analizi ve ESG sütun (Pillar) sınıflandırıcı testleri."""

    def test_analysis_result_schema(self):
        res = ESGAnalysisResult(
            sentiment="Pozitif",
            pillar="Environmental",
            impact_score=0.8,
            explanation="Güneş enerjisi yatırımı çevre puanını artırdı."
        )
        assert res.sentiment == "Pozitif"
        assert res.pillar == "Environmental"
        assert -1.5 <= res.impact_score <= 1.5

    def test_rule_based_fallback_environmental_positive(self):
        analyzer = ESGCommentAnalyzer()
        res = analyzer._fallback_analyze("Şirket harika ve temiz bir güneş enerjisi tesisi kurdu.")
        assert res["sentiment"] == "Pozitif"
        assert res["pillar"] == "Environmental"
        assert res["impact_score"] > 0

    def test_rule_based_fallback_social_negative(self):
        analyzer = ESGCommentAnalyzer()
        res = analyzer._fallback_analyze("Fabrikada iş güvenliği ihlalleri ve çalışan mobbing şikayetleri var.")
        assert res["sentiment"] == "Negatif"
        assert res["pillar"] == "Social"
        assert res["impact_score"] < 0

    def test_rule_based_fallback_governance_negative(self):
        analyzer = ESGCommentAnalyzer()
        res = analyzer._fallback_analyze("Yönetim kurulu rüşvet ve yolsuzluk iddiaları ile çalkalanıyor.")
        assert res["sentiment"] == "Negatif"
        assert res["pillar"] == "Governance"
        assert res["impact_score"] < 0

    def test_empty_or_neutral_comment(self):
        analyzer = ESGCommentAnalyzer()
        res = analyzer._fallback_analyze("Ürün bugün kargoya verildi.")
        assert res["sentiment"] == "Nötr"
        assert res["impact_score"] == 0.0
