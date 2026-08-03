"""
Yeşil Aklama (Greenwashing) API Testi
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# backend yolunu ekle
sys.path.append(str(Path(__file__).parent))

from api import app

client = TestClient(app)

def test_clean_scenario():
    # 1. Clean scenario yükle
    res = client.post("/api/demo/load-scenario", json={"scenario": "clean"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_greenwashed"] is False
    assert data["risk_score"] < 10
    assert data["carbon_impact"]["hidden_scope1_tco2e"] == 0.0
    print("[PASS] Clean Scenario API Test PASSED")

def test_greenwashed_scenario():
    # 2. Greenwashed scenario yükle
    res = client.post("/api/demo/load-scenario", json={"scenario": "greenwashed"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_greenwashed"] is True
    assert data["risk_score"] > 80
    assert data["carbon_impact"]["hidden_scope1_tco2e"] > 0
    assert len(data["discrepancies"]) >= 2
    print("[PASS] Greenwashed Scenario API Test PASSED")

def test_audit_endpoint():
    res = client.get("/api/documents/audit-greenwash")
    assert res.status_code == 200
    data = res.json()
    print("[PASS] GET /api/documents/audit-greenwash PASSED")

if __name__ == "__main__":
    test_clean_scenario()
    test_greenwashed_scenario()
    test_audit_endpoint()
    print("ALL GREENWASHING TESTS PASSED PERFECTLY!")

