from __future__ import annotations

import hashlib
import re
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .schemas import Evidence


TRACKING_KEYS = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"}


def canonical_url(url: str) -> str:
    parts = urlsplit(str(url))
    query = urlencode(sorted((k, v) for k, v in parse_qsl(parts.query) if k.lower() not in TRACKING_KEYS))
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), query, ""))


def event_key(item: Evidence) -> str:
    normalized = re.sub(r"\W+", " ", f"{item.pillar.value} {item.topic} {item.title}".casefold()).strip()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def deduplicate(items: list[Evidence]) -> list[Evidence]:
    seen_urls: set[str] = set()
    seen_content: set[str] = set()
    seen_events: set[str] = set()
    unique: list[Evidence] = []
    for item in items:
        url_key = canonical_url(str(item.url))
        content_key = hashlib.sha256(re.sub(r"\s+", " ", item.body.casefold()).strip().encode("utf-8")).hexdigest()
        evt_key = event_key(item)
        if url_key in seen_urls or content_key in seen_content or evt_key in seen_events:
            continue
        seen_urls.add(url_key)
        seen_content.add(content_key)
        seen_events.add(evt_key)
        unique.append(item)
    return unique
