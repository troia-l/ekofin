import pytest
from modules.carbon.calculator import CarbonCalculator
from modules.carbon.extractor import ExtractedActivity, CarbonExtractionModel, extract_activities
from modules.carbon.roi import (
    ROIRequest,
    _static_calculate_groi,
    calculate_green_credit,
    CARBON_PRICE_USD,
    USD_TO_TRY
)


class TestCarbonCalculator:
    """Karbon hesaplama motoru testleri."""

    def test_calculator_initialization(self):
        calc = CarbonCalculator()
        assert calc.factors is not None
        assert "hammadde" in calc.factors
        assert "enerji" in calc.factors
        assert "lojistik" in calc.factors

    def test_calculate_electricity_emissions(self):
        calc = CarbonCalculator()
        # 1000 kWh elektrik (TEİAŞ faktörü: ~0.45 kgCO2e/kWh -> 450 kg -> 0.45 tCO2e)
        co2_tons, trace = calc.calculate_activity_emissions(
            category="enerji",
            item_type="elektrik_sebeke",
            amount=1000.0,
            unit="kWh"
        )
        assert co2_tons == pytest.approx(0.45, rel=1e-2)
        assert "tCO2e" in trace

    def test_calculate_raw_material_ton_conversion(self):
        calc = CarbonCalculator()
        # 2 ton pamuk -> 2000 kg * 0.42 kgCO2e/kg = 840 kg -> 0.84 tCO2e
        co2_tons, trace = calc.calculate_activity_emissions(
            category="hammadde",
            item_type="pamuk",
            amount=2.0,
            unit="ton"
        )
        assert co2_tons == pytest.approx(0.84, rel=1e-2)
        assert "ton -> 2000.0 kg dönüştürüldü" in trace

    def test_unknown_category_or_item(self):
        calc = CarbonCalculator()
        co2_tons, trace = calc.calculate_activity_emissions(
            category="bilinmeyen_kat",
            item_type="pamuk",
            amount=10.0,
            unit="kg"
        )
        assert co2_tons == 0.0
        assert "Bilinmeyen kategori" in trace

    def test_process_calculation_batch(self):
        calc = CarbonCalculator()
        model = CarbonExtractionModel(
            company_activities=[
                ExtractedActivity(category="enerji", item_type="elektrik_sebeke", amount=10000.0, unit="kWh"),
                ExtractedActivity(category="lojistik", item_type="dizel_kamyon", amount=1000.0, unit="km")
            ]
        )
        res = calc.process_calculation(model)
        assert "total_co2_tons" in res
        assert res["total_co2_tons"] > 0
        assert len(res["results"]) == 2
        assert len(res["audit_trail"]) == 2


class TestCarbonExtractor:
    """Metinden karbon faaliyeti çıkarma testleri (Mock fallback)."""

    def test_mock_parser_fallback(self):
        # GEMINI_API_KEY olmadan da regex tabanlı otonom çıkarım çalışmalıdır
        text = "Aylık 10 ton pamuk işlenmekte ve 3 kamyon ile lojistik yapılmaktadır. Fabrikada elektrik tüketilmektedir."
        res = extract_activities(text)
        assert isinstance(res, CarbonExtractionModel)
        assert len(res.company_activities) >= 2
        categories = [act.category for act in res.company_activities]
        assert "hammadde" in categories
        assert "lojistik" in categories

    def test_extracted_activity_model_validation(self):
        act = ExtractedActivity(
            category="enerji",
            item_type="dogalgaz",
            amount=500.0,
            unit="m3"
        )
        assert act.amount == 500.0
        assert act.unit == "m3"


class TestGreenROI:
    """5 bileşenli g-ROI ve Yeşil Kredi Analiz Motoru testleri."""

    def test_static_groi_calculation(self):
        req = ROIRequest(
            total_co2_tons=100.0,
            extracted_activities=[
                {"category": "enerji", "item_type": "elektrik_sebeke", "amount": 50000.0, "unit": "kWh"}
            ],
            investment_tl=1_000_000.0,
            loan_years=5,
            reduction_target_pct=30.0
        )
        result = _static_calculate_groi(req)

        # Doğrulamalar
        assert isinstance(result.groi_percent, float)
        assert result.payback_years > 0
        assert 0 <= result.green_finance_score <= 100
        assert result.breakdown.carbon_tax_saving_tl > 0
        assert result.breakdown.total_annual_benefit_tl > 0
        assert len(result.audit_notes) >= 4

    def test_green_credit_discount(self):
        credit_res = calculate_green_credit(
            total_co2_tons=120.0,
            ges_budget=800000.0,
            ev_count=3,
            eff_budget=250000.0,
            waste_budget=150000.0,
            water_budget=75000.0,
            loan_amount=1000000.0,
            loan_years=5,
            financial_rating="BBB"
        )
        assert credit_res.green_credit_score > 0
        assert credit_res.discount_pct >= 0
        assert credit_res.total_capex > 0
        assert credit_res.carbon_reduction > 0
        assert len(credit_res.audit_notes) > 0
