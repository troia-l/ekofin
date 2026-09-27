"""
TSRS Sürdürülebilirlik Raporu Üretimi, Doğrulama ve Durum Router'ı
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Form

from config import (
    get_company_sources_dir,
    get_company_report_path,
    get_company_eklenen_veriler_path,
)
from .common import (
    ReportStatus,
    _get_report_status,
    _set_report_status,
    _compute_file_hash,
)

router = APIRouter(tags=["TSRS Report"])


@router.post("/api/report/generate")
def generate_report(ticker: Optional[str] = None):
    """TSRS pipeline'ını doğrudan modül olarak çağırarak (şirkete özel) rapor üret."""
    if _get_report_status(ticker).status == "generating":
        raise HTTPException(status_code=409, detail="Rapor üretimi zaten devam ediyor.")

    _set_report_status(ticker, ReportStatus(
        status="generating", progress=10, message="Pipeline başlatılıyor..."
    ))

    try:
        from modules.tsrs.pipeline import run_tsrs_pipeline

        def progress_cb(filename, current_step, total_steps):
            progress_pct = int(20 + (current_step / total_steps) * 75)
            section_titles = {
                "bolum_00_baslik.md": "Kapak ve Başlık Bölümü",
                "bolum_01_rapor_hakkinda.md": "Rapor Hakkında ve Kapsam",
                "bolum_02_yonetisim.md": "Yönetişim Yapısı ve Politikalar",
                "bolum_03_strateji.md": "Sürdürülebilirlik Stratejisi",
                "bolum_04_risk_yonetimi.md": "Risk Yönetimi Süreçleri",
                "bolum_05_metrikler.md": "Metrikler, Göstergeler ve Hedefler",
                "bolum_06_muhakemeler.md": "Önemli Muhakemeler ve Varsayımlar",
                "bolum_07_ekler.md": "Ekler, Kısıtlar ve Hesaplama Metotları",
                "bolum_08_iletisim.md": "Geri Bildirim ve İletişim Kanalları",
                "bolum_09_dogrulama.md": "Güvence ve Doğrulama Beyanı"
            }
            title = section_titles.get(filename, filename)
            _set_report_status(ticker, ReportStatus(
                status="generating",
                progress=progress_pct,
                message=f"{title} oluşturuluyor ({current_step}/{total_steps})..."
            ))

        _set_report_status(ticker, ReportStatus(
            status="generating", progress=20, message="Pipeline çalıştırılıyor..."
        ))

        result = run_tsrs_pipeline(
            progress_callback=progress_cb,
            sources_dir=get_company_sources_dir(ticker),
            report_path=get_company_report_path(ticker),
            eklenen_path=get_company_eklenen_veriler_path(ticker),
        )

        if result["status"] == "error":
            _set_report_status(ticker, ReportStatus(
                status="error",
                progress=0,
                message=f"Pipeline hatası: {result.get('error', 'Bilinmeyen hata')[:500]}",
            ))
            raise HTTPException(
                status_code=500,
                detail=f"Pipeline hatası: {result.get('error', '')}",
            )

        _set_report_status(ticker, ReportStatus(
            status="completed", progress=100, message="Rapor başarıyla üretildi."
        ))

        report_path = get_company_report_path(ticker)
        return {
            "status": "success",
            "message": "TSRS raporu başarıyla üretildi.",
            "output_path": result.get("output_path"),
            "hash": _compute_file_hash(report_path) if report_path.exists() else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        _set_report_status(ticker, ReportStatus(status="error", progress=0, message=str(e)))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/report/latest")
def get_latest_report(ticker: Optional[str] = None):
    """Son üretilen (şirkete özel) TSRS raporunun içeriğini döndür."""
    report_path = get_company_report_path(ticker)
    if not report_path.exists():
        return {"status": "not_found", "content": None}

    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()

    return {
        "status": "found",
        "content": content,
        "hash": _compute_file_hash(report_path),
        "generated_at": datetime.fromtimestamp(
            report_path.stat().st_mtime
        ).isoformat(),
    }


@router.get("/api/report/status")
def report_status(ticker: Optional[str] = None):
    """Rapor üretim durumunu (şirkete özel) döndür."""
    current = _get_report_status(ticker)
    state = current.model_dump()
    if current.status == "error":
        # Hata durumunu bir kez döndürdükten sonra sıfırla (sayfa yenilenince temizlenmesi için)
        _set_report_status(ticker, ReportStatus(status="idle", progress=0, message=""))
    return state


@router.post("/api/report/verify")
def verify_report(hash_to_verify: str = Form(...), ticker: Optional[str] = Form(None)):
    """Rapor hash'ini (şirkete özel) doğrula."""
    report_path = get_company_report_path(ticker)
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Rapor dosyası bulunamadı.")

    actual_hash = _compute_file_hash(report_path)
    is_valid = actual_hash == hash_to_verify

    return {
        "is_valid": is_valid,
        "actual_hash": actual_hash,
        "provided_hash": hash_to_verify,
        "verified_at": datetime.now().isoformat(),
    }
