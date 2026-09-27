from __future__ import annotations

from urllib.parse import urlparse


class SourcePolicy:
    """İzinli kaynakları ve sürümlü ağırlıkları tek yerde tutar."""

    version = "source-policy-v1"
    _weights = {
        "epa.gov": 1.0,
        "eeoc.gov": 1.0,
        "sec.gov": 1.0,
        "nhtsa.gov": 1.0,
        "kap.org.tr": 1.0,
        "reuters.com": 0.85,
        "apnews.com": 0.85,
    }

    def weight_for(self, url: str) -> float:
        host = (urlparse(str(url)).hostname or "").lower()
        for domain, weight in self._weights.items():
            if host == domain or host.endswith("." + domain):
                return weight
        return 0.0

    def is_allowed(self, url: str) -> bool:
        return self.weight_for(url) > 0
