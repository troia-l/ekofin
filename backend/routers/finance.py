"""
Kredi Teklifleri ve Kitle Fonlama Router'ı
"""

import json
from fastapi import APIRouter, HTTPException

from config import CREDITS_PATH, CROWDFUNDING_PATH

router = APIRouter(tags=["Finance & Credits"])


@router.get("/api/credits")
def get_credits():
    """Kredi tekliflerini JSON veritabanından yükle."""
    if not CREDITS_PATH.exists():
        raise HTTPException(status_code=404, detail="Kredi teklifleri veritabanı bulunamadı.")
    with open(CREDITS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/api/crowdfunding")
def get_crowdfunding():
    """Kitle fonlama projelerini JSON veritabanından yükle."""
    if not CROWDFUNDING_PATH.exists():
        raise HTTPException(status_code=404, detail="Kitle fonlama veritabanı bulunamadı.")
    with open(CROWDFUNDING_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
