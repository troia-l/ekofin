from decimal import Decimal

from config import get_company_sources_dir
from modules.tsrs.metrics import calculate_metrics


def test_testco_metrics_are_deterministic():
    metrics = calculate_metrics(get_company_sources_dir("TESTCO"))
    assert metrics["scope_1_tco2e"] == Decimal("136.05")
    assert metrics["scope_2_tco2e"] == Decimal("180.00")
    assert metrics["scope_1_2_total_tco2e"] == Decimal("316.05")
    assert metrics["intensity_tco2e_per_million_try"] == Decimal("2.107")
