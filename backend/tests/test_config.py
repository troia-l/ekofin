import pytest
from pathlib import Path
from config import (
    _safe_ticker,
    get_company_sources_dir,
    get_company_declaration_path,
    get_company_uploads_meta_path,
    get_company_report_path,
    DOCUMENT_TYPE_MAP,
    SOURCES_DIR,
    OUTPUT_DIR
)


class TestConfigAndPaths:
    """Merkezi yapılandırma ve şirket bazlı izolasyon yardımcıları testleri."""

    def test_safe_ticker(self):
        assert _safe_ticker("asels") == "ASELS"
        assert _safe_ticker("  toaso  ") == "TOASO"
        assert _safe_ticker("") == "DEFAULT"
        assert _safe_ticker(None) == "DEFAULT"

    def test_company_sources_dir(self):
        sources_dir = get_company_sources_dir("FROTO")
        assert isinstance(sources_dir, Path)
        assert sources_dir.name == "FROTO"
        assert sources_dir.parent == SOURCES_DIR
        assert sources_dir.exists()

    def test_company_declaration_path(self):
        decl_path = get_company_declaration_path("THYAO")
        assert decl_path.name == "yonetici_anketi.json"
        assert decl_path.parent.name == "THYAO"

    def test_company_report_path(self):
        report_path = get_company_report_path("SISE")
        assert report_path.name == "TSRS_Uyumlu_Surdurulebilirlik_Raporu.md"
        assert report_path.parent == OUTPUT_DIR / "SISE"

    def test_document_type_map_integrity(self):
        required_types = ["fatura", "mizan", "sgk", "ekb", "motat", "osgb", "tasit", "faaliyet"]
        for t in required_types:
            assert t in DOCUMENT_TYPE_MAP
            assert DOCUMENT_TYPE_MAP[t].endswith((".md", ".json"))
