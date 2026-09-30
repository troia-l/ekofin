"""
EkoFin Merkezi Loglama ve İzlenebilirlik Altyapısı (Telemetry & Logging Engine)
Tüm HTTP isteklerini, fonksiyon çağrılarını, veri tabanı işlemlerini ve
LLM API (Gemini / OpenAI) istek-yanıt-fallback döngülerini tek merkezden izler.
"""

import functools
import logging
import os
import sys
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Callable, Optional

from config import BASE_DIR

# ─── Dizin Yapılandırması ───────────────────────────────────────────────────
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOGS_DIR / "ekofin.log"

# ─── Log Formatlayıcıları ───────────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s | %(levelname)-7s | [%(name)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def _setup_logger() -> logging.Logger:
    """Merkezi sistem logger'ını ilklendirir."""
    logger = logging.getLogger("ekofin")
    logger.setLevel(logging.INFO)

    # Çift handler eklenmesini önle
    if logger.handlers:
        return logger

    # 1. Konsol Çıktısı (Canlı terminal izleme - Windows cp1254 uyumlu UTF-8)
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # 2. Kalıcı Dosya Çıktısı (Rotating: max 10MB, 5 yedek dosya)
    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    return logger


logger = _setup_logger()


# ─── LLM İstek & Yanıt İzleyicileri ─────────────────────────────────────────

def log_llm_request(provider: str, model: str, task: str, prompt_preview: str = ""):
    """LLM'e bir istek atıldığında çağrılır."""
    preview = f" | Girdi: \"{prompt_preview[:120]}...\"" if prompt_preview else ""
    logger.info(f"🤖 [LLM-İSTEK] Sağlayıcı: {provider} | Model: {model} | Görev: {task}{preview}")


def log_llm_response(provider: str, model: str, task: str, elapsed_ms: float, success: bool = True, details: str = ""):
    """LLM'den yanıt alındığında veya hata oluştuğunda çağrılır."""
    det = f" | Detay: {details}" if details else ""
    if success:
        logger.info(f"✅ [LLM-BAŞARILI] {provider} ({model}) | Görev: {task} | Süre: {elapsed_ms:.1f}ms{det}")
    else:
        logger.warning(f"❌ [LLM-HATA] {provider} ({model}) | Görev: {task} | Süre: {elapsed_ms:.1f}ms{det}")


def log_llm_fallback(task: str, original_provider: str, fallback_to: str, reason: str = ""):
    """LLM çağrısı başarısız olup yerel kural motoruna veya başka modele geçildiğinde çağrılır."""
    r = f" (Neden: {reason})" if reason else ""
    logger.warning(f"⚠️ [LLM-FALLBACK] Görev: {task} | {original_provider} ➔ {fallback_to}{r}")


# ─── Fonksiyon Çağrı İzleme Dekoratörü (Tracing Decorator) ───────────────────

def trace_call(category: str = "CORE"):
    """
    Herhangi bir fonksiyonun çağrıldığını, argümanlarını, dönüş durumunu
    ve çalışma süresini hiçbir iş mantığını değiştirmeden loglar.
    Hem senkron hem de asenkron fonksiyonları destekler.
    """
    import inspect

    def decorator(func: Callable) -> Callable:
        if inspect.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                func_name = func.__qualname__
                arg_str = ", ".join([str(a)[:50] for a in args] + [f"{k}={str(v)[:50]}" for k, v in kwargs.items()])
                logger.info(f"⚡ [{category}] {func_name}() çağrıldı -> Parametreler: ({arg_str})")
                start = time.perf_counter()
                try:
                    result = await func(*args, **kwargs)
                    elapsed = (time.perf_counter() - start) * 1000
                    logger.info(f"✔️ [{category}] {func_name}() tamamlandı -> {elapsed:.1f}ms")
                    return result
                except Exception as e:
                    elapsed = (time.perf_counter() - start) * 1000
                    logger.error(f"💥 [{category}] {func_name}() HATA verdi ({elapsed:.1f}ms): {e}")
                    raise
            return async_wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                func_name = func.__qualname__
                arg_str = ", ".join([str(a)[:50] for a in args] + [f"{k}={str(v)[:50]}" for k, v in kwargs.items()])
                logger.info(f"⚡ [{category}] {func_name}() çağrıldı -> Parametreler: ({arg_str})")
                start = time.perf_counter()
                try:
                    result = func(*args, **kwargs)
                    elapsed = (time.perf_counter() - start) * 1000
                    logger.info(f"✔️ [{category}] {func_name}() tamamlandı -> {elapsed:.1f}ms")
                    return result
                except Exception as e:
                    elapsed = (time.perf_counter() - start) * 1000
                    logger.error(f"💥 [{category}] {func_name}() HATA verdi ({elapsed:.1f}ms): {e}")
                    raise
            return sync_wrapper
    return decorator
