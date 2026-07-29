"""
ESG Haber Toplama Modülü — Google News RSS Entegrasyonu
Şirket bazlı güncel haberleri güvenilir kaynak listesiyle filtreleyerek çeker,
her haberi ESGCommentAnalyzer ile analiz edip kaynak/link/tarih bilgisiyle döner.
API key gerektirmez.
"""

import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from typing import List, Dict, Any

# Güvenilir yayın organı domain'leri (alt domain de kabul edilir, örn. bigpara.hurriyet.com.tr)
TRUSTED_DOMAINS = [
    "aa.com.tr", "bloomberght.com", "reuters.com", "dunya.com", "ntv.com.tr",
    "hurriyet.com.tr", "sabah.com.tr", "milliyet.com.tr", "cnnturk.com",
    "haberturk.com", "ekonomim.com", "sozcu.com.tr", "trthaber.com",
    "kap.org.tr", "borsagundem.com", "foreks.com", "bigpara.hurriyet.com.tr",
    "finansgundem.com", "dw.com", "bbc.com", "investing.com", "cnbce.com",
    "para.com.tr", "gazeteoku.com", "yenisafak.com", "birgun.net",
    "cumhuriyet.com.tr", "iha.com.tr", "anadoluajansi.com.tr",
]

USER_AGENT = "Mozilla/5.0 (compatible; EkoFinBot/1.0; +https://ekofin.local)"


def _is_trusted(domain: str) -> bool:
    domain = (domain or "").lower()
    return any(domain == d or domain.endswith("." + d) for d in TRUSTED_DOMAINS)


def _clean_title(raw_title: str) -> str:
    # Google News başlıkları "Haber Başlığı - Kaynak Adı" formatındadır
    return re.sub(r"\s+-\s+[^-]+$", "", raw_title).strip()


class NewsFetcher:
    """Google News RSS'ten şirket haberlerini çeker (ham, NLP analizi yapılmadan).
    Analiz maliyetli (LLM) olduğundan çağıran taraf yalnızca henüz kayıtlı olmayan
    (yeni) haberleri analiz etmelidir — bkz. api.py: _ensure_fresh_news."""

    def fetch_for_company(self, ticker: str, company_name: str, max_items: int = 8) -> List[Dict[str, Any]]:
        query = urllib.parse.quote(f'"{company_name}"')
        url = f"https://news.google.com/rss/search?q={query}&hl=tr&gl=TR&ceid=TR:tr"

        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=8) as resp:
                xml_data = resp.read()
        except Exception as e:
            print(f"[UYARI] Haber çekilemedi ({ticker}): {e}")
            return []

        try:
            root = ET.fromstring(xml_data)
        except ET.ParseError as e:
            print(f"[UYARI] RSS parse hatası ({ticker}): {e}")
            return []

        results = []
        for item in root.iter("item"):
            if len(results) >= max_items:
                break

            title_el = item.find("title")
            link_el = item.find("link")
            pubdate_el = item.find("pubDate")
            source_el = item.find("source")

            if title_el is None or link_el is None:
                continue

            source_domain = ""
            source_name = ""
            if source_el is not None:
                source_name = (source_el.text or "").strip()
                source_url = source_el.get("url", "")
                source_domain = urllib.parse.urlparse(source_url).netloc.replace("www.", "")

            if not _is_trusted(source_domain):
                continue

            title = _clean_title(title_el.text or "")
            if not title:
                continue

            published_date = ""
            if pubdate_el is not None and pubdate_el.text:
                try:
                    published_date = parsedate_to_datetime(pubdate_el.text).strftime("%Y-%m-%d %H:%M:%S")
                except Exception:
                    published_date = ""

            results.append({
                "ticker": ticker.upper(),
                "title": title,
                "source": source_name or source_domain,
                "url": (link_el.text or "").strip(),
                "published_date": published_date,
            })

        return results
