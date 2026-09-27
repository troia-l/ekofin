"""TESTCO fixture ve üretilen TSRS raporu için deterministik smoke test."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
FIXTURE_DIR = BACKEND_DIR / "data" / "sources" / "TESTCO"
EXPECTED_PATH = FIXTURE_DIR / "expected_results.json"

REQUIRED_SOURCE_FILES = {
    "şirket-faliyet-raporu.md",
    "yonetici_anketi.json",
    "sanayi_sicil.json",
    "iso_14001.json",
    "kapasite_raporu.json",
    "mizan.md",
    "faturalar.md",
    "motat-atik-ve-su-beyani.md",
    "ekb.md",
    "osgb-raporu.md",
    "sgk_listesi.md",
    "tasit-tanima-sistemi.md",
}

FORBIDDEN_REPORT_PATTERNS = {
    r"55\s+aktif\s+personel": "mock çalışan sayısı",
    r"toplam\s+55\s+(?:aktif\s+)?(?:çalışan|personel)": "mock çalışan sayısı",
    r"14[.,]500\s*kWh": "mock elektrik tüketimi",
    r"15[.,]42\s*tCO2e": "mock emisyon değeri",
    r"SAP\s+ERP": "kaynağı olmayan ERP iddiası",
    r"Green\s+Ledger": "kaynağı olmayan sistem iddiası",
    r"blockchain\s+ile\s+doğruland": "kaynağı olmayan doğrulama iddiası",
    r"toplam\s+kapsam\s+1\s+ve\s+kapsam\s+2\s+emisyon\s+profili\s+yaklaşık\s+276[.,]96": "çelişkili Kapsam 1+2 toplamı",
    r"!\[\]\[image\d+\]": "çözümlenmemiş görsel referansı",
    r"tüm\s+hükümleriyle\s+tam\s+uyumlu\s+ve\s+koşulsuz": "kanıtsız tam TSRS uyum beyanı",
    r"resm[iî]\s+ve\s+doğrulanmış\s+iklim\s+hedefi": "kanıtsız doğrulanmış hedef iddiası",
    r"KGK\s+Bağımsız\s+Denetçi\s+Portalı\s+ile\s+Kriptografik\s+Olarak\s+Doğrulanmıştır": "gerçekleşmemiş portal doğrulaması",
    r"https://ekofin\.gov\.tr/dogrula/passport-id-\[Dinamik_ID\]": "sahte doğrulama URL adresi",
}


def close(actual: float, expected: float, tolerance: float = 0.001) -> None:
    if not math.isclose(actual, expected, abs_tol=tolerance):
        raise AssertionError(f"Beklenen {expected}, hesaplanan {actual}")


def validate_fixture() -> dict:
    missing = sorted(name for name in REQUIRED_SOURCE_FILES if not (FIXTURE_DIR / name).is_file())
    if missing:
        raise AssertionError(f"Eksik kaynak dosyaları: {', '.join(missing)}")

    expected = json.loads(EXPECTED_PATH.read_text(encoding="utf-8"))
    capacity = json.loads((FIXTURE_DIR / "kapasite_raporu.json").read_text(encoding="utf-8"))
    declaration = json.loads((FIXTURE_DIR / "yonetici_anketi.json").read_text(encoding="utf-8"))

    if expected["synthetic"] is not True or capacity["synthetic_test_data"] is not True:
        raise AssertionError("Fixture sentetik veri olarak işaretlenmemiş.")
    if capacity["actual_production"] != expected["production_units"]:
        raise AssertionError("Üretim miktarı beklenen sonuçla uyuşmuyor.")
    if declaration["targets"]["base_year"] != expected["reporting_year"]:
        raise AssertionError("Hedef baz yılı raporlama dönemiyle uyuşmuyor.")

    factors = expected["emission_factors_kgco2e"]
    scope_1 = (
        expected["natural_gas_sm3"] * factors["natural_gas_per_sm3"]
        + expected["diesel_liters"] * factors["diesel_per_liter"]
        + expected["gasoline_liters"] * factors["gasoline_per_liter"]
    ) / 1000
    scope_2 = expected["electricity_kwh"] * factors["electricity_per_kwh"] / 1000
    total = scope_1 + scope_2
    intensity = total / (expected["net_revenue_try"] / 1_000_000)

    close(scope_1, expected["scope_1_tco2e"])
    close(scope_2, expected["scope_2_location_based_tco2e"])
    close(total, expected["scope_1_2_total_tco2e"])
    close(intensity, expected["scope_1_2_intensity_tco2e_per_million_try"])

    source_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in FIXTURE_DIR.iterdir()
        if path.suffix in {".md", ".json"}
    )
    for token in ("48", "360.000", "48.000", "12.000", "3.000", "150.000.000"):
        if token not in source_text:
            raise AssertionError(f"Beklenen kaynak değeri bulunamadı: {token}")

    return {
        "scope_1_tco2e": scope_1,
        "scope_2_tco2e": scope_2,
        "total_tco2e": total,
        "intensity_tco2e_per_million_try": intensity,
    }


def normalize_number_text(text: str) -> str:
    return re.sub(r"\s+", "", text.casefold())


def validate_report(report_path: Path) -> None:
    if not report_path.is_file():
        raise AssertionError(f"Rapor bulunamadı: {report_path}")
    report = report_path.read_text(encoding="utf-8")

    forbidden = [
        description
        for pattern, description in FORBIDDEN_REPORT_PATTERNS.items()
        if re.search(pattern, report, flags=re.IGNORECASE)
    ]
    compact = normalize_number_text(report)
    expected_alternatives = {
        "çalışan sayısı 48": ("48çalışan", "48personel", "toplamçalışan|48"),
        "elektrik 360.000 kWh": ("360.000kwh", "360000kwh"),
        "Kapsam 1 136,05 tCO2e": (
            "136,05tco2e", "136.05tco2e", "136,05tonco2e", "136.05tonco2e"
        ),
        "Kapsam 2 180,00 tCO2e": (
            "180,00tco2e", "180.00tco2e", "180tco2e",
            "180,00tonco2e", "180.00tonco2e", "180tonco2e"
        ),
        "net satışlar 150.000.000 TL": ("150.000.000tl", "150000000tl"),
    }
    missing = [
        label
        for label, alternatives in expected_alternatives.items()
        if not any(value in compact for value in alternatives)
    ]
    problems = []
    if forbidden:
        problems.append("fixture dışı içerik: " + ", ".join(sorted(set(forbidden))))
    if missing:
        problems.append("beklenen kaynak değerleri eksik: " + ", ".join(missing))
    if "sentetik test verisi" not in report.casefold():
        problems.append("sentetik veri uyarısı rapora taşınmamış")

    reported_hashes = {
        value.casefold()
        for value in re.findall(r"(?i)(?:0x)?([0-9a-f]{64})", report)
    }
    actual_hash = hashlib.sha256(report_path.read_bytes()).hexdigest()
    if reported_hashes and actual_hash not in reported_hashes:
        problems.append("raporda yazan SHA-256 gerçek dosya özetiyle eşleşmiyor")
    if problems:
        raise AssertionError("Raporda " + "; ".join(problems))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, help="İsteğe bağlı üretilmiş Markdown rapor yolu")
    args = parser.parse_args()

    try:
        calculated = validate_fixture()
        print("PASS: TESTCO kaynak paketi eksiksiz ve hesaplar tutarlı.")
        print(json.dumps(calculated, ensure_ascii=False, indent=2))
        if args.report:
            validate_report(args.report if args.report.is_absolute() else BACKEND_DIR / args.report)
            print("PASS: Rapor beklenen TESTCO değerlerini içeriyor ve bilinen mock iddiaları taşımıyor.")
        return 0
    except (AssertionError, OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
