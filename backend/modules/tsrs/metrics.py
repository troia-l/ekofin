"""Kaynak belgelerden deterministik TSRS metrikleri üretir."""

from __future__ import annotations

import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


FACTORS = {
    "natural_gas_kgco2e_per_sm3": Decimal("2.02"),
    "diesel_kgco2e_per_liter": Decimal("2.68"),
    "gasoline_kgco2e_per_liter": Decimal("2.31"),
    "electricity_kgco2e_per_kwh": Decimal("0.50"),
}
FACTOR_VERSION = "ekofin-fixture-2025-v1"


def _tr_decimal(value: str) -> Decimal:
    return Decimal(value.replace(".", "").replace(",", ".").strip())


def _table_value(text: str, label: str) -> Decimal:
    match = re.search(
        rf"\|\s*(?:\*\*)?{re.escape(label)}(?:\*\*)?\s*\|\s*(?:\*\*)?([\d.,]+)",
        text,
        re.IGNORECASE,
    )
    if not match:
        raise ValueError(f"Kaynak metriği bulunamadı: {label}")
    return _tr_decimal(match.group(1))


def _optional_table_value(text: str, label: str) -> Decimal:
    try:
        return _table_value(text, label)
    except ValueError:
        return Decimal(0)


def calculate_metrics(sources_dir: Path) -> dict[str, Decimal | str]:
    invoices = (sources_dir / "faturalar.md").read_text(encoding="utf-8")
    fleet_path = sources_dir / "tasit-tanima-sistemi.md"
    fleet = fleet_path.read_text(encoding="utf-8") if fleet_path.exists() else ""
    ledger = (sources_dir / "mizan.md").read_text(encoding="utf-8")
    employees_path = sources_dir / "sgk_listesi.md"
    employees = employees_path.read_text(encoding="utf-8") if employees_path.exists() else ""

    total = re.search(
        r"\|\s*\*\*TOPLAM\*\*\s*\|\s*\*\*([\d.,]+)\*\*\s*\|\s*\*\*([\d.,]+)\*\*\s*\|\s*\*\*([\d.,]+)",
        invoices,
        re.IGNORECASE,
    )
    if not total:
        raise ValueError("Fatura toplam satırı bulunamadı.")

    electricity = _tr_decimal(total.group(1))
    natural_gas = _tr_decimal(total.group(2))
    water = _tr_decimal(total.group(3))
    diesel = _optional_table_value(fleet, "Yıllık dizel tüketimi")
    gasoline = _optional_table_value(fleet, "Yıllık benzin tüketimi")
    revenue = _table_value(ledger, "Net satışlar")
    employee_count = _optional_table_value(employees, "Toplam çalışan")

    scope_1 = (
        natural_gas * FACTORS["natural_gas_kgco2e_per_sm3"]
        + diesel * FACTORS["diesel_kgco2e_per_liter"]
        + gasoline * FACTORS["gasoline_kgco2e_per_liter"]
    ) / Decimal(1000)
    scope_2 = electricity * FACTORS["electricity_kgco2e_per_kwh"] / Decimal(1000)
    combined = scope_1 + scope_2
    intensity = combined / (revenue / Decimal(1_000_000))

    q = Decimal("0.01")
    return {
        "factor_version": FACTOR_VERSION,
        "electricity_kwh": electricity,
        "natural_gas_sm3": natural_gas,
        "water_m3": water,
        "diesel_liters": diesel,
        "gasoline_liters": gasoline,
        "net_revenue_try": revenue,
        "employee_count": employee_count,
        "scope_1_tco2e": scope_1.quantize(q, rounding=ROUND_HALF_UP),
        "scope_2_tco2e": scope_2.quantize(q, rounding=ROUND_HALF_UP),
        "scope_1_2_total_tco2e": combined.quantize(q, rounding=ROUND_HALF_UP),
        "intensity_tco2e_per_million_try": intensity.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP),
    }


def write_metrics_source(sources_dir: Path, reporting_year: int) -> Path:
    metrics = calculate_metrics(sources_dir)

    def tr(value: Decimal, places: int = 2) -> str:
        return f"{value:,.{places}f}".replace(",", "_").replace(".", ",").replace("_", ".")

    output = sources_dir / "hesaplanan_metrikler.md"
    output.write_text(
        "\n".join([
            "# Deterministik Hesaplanan TSRS Metrikleri",
            "",
            f"- Raporlama dönemi: {reporting_year}",
            f"- Faktör seti sürümü: {metrics['factor_version']}",
            f"- Çalışan sayısı: {int(metrics['employee_count'])} çalışan (kaynak: sgk_listesi.md)",
            f"- Elektrik tüketimi: {tr(metrics['electricity_kwh'], 0)} kWh (kaynak: faturalar.md)",
            f"- Doğal gaz tüketimi: {tr(metrics['natural_gas_sm3'], 0)} Sm³ (kaynak: faturalar.md)",
            f"- Dizel tüketimi: {tr(metrics['diesel_liters'], 0)} litre (kaynak: tasit-tanima-sistemi.md)",
            f"- Benzin tüketimi: {tr(metrics['gasoline_liters'], 0)} litre (kaynak: tasit-tanima-sistemi.md)",
            f"- Net satışlar: {tr(metrics['net_revenue_try'], 0)} TL (kaynak: mizan.md)",
            f"- Kapsam 1: {tr(metrics['scope_1_tco2e'])} tCO2e",
            f"- Kapsam 2 (konum bazlı): {tr(metrics['scope_2_tco2e'])} tCO2e",
            f"- Kapsam 1+2 toplamı: {tr(metrics['scope_1_2_total_tco2e'])} tCO2e",
            f"- Emisyon yoğunluğu: {tr(metrics['intensity_tco2e_per_million_try'], 3)} tCO2e / milyon TL net satış",
            "",
            "Bu değerler uygulama tarafından Decimal aritmetiğiyle hesaplanmıştır. LLM bu değerleri yeniden hesaplamamalı veya değiştirmemelidir.",
        ]),
        encoding="utf-8",
    )
    return output
