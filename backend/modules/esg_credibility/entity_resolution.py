from __future__ import annotations

import re


class EntityResolver:
    def confidence(self, company_name: str, aliases: list[str], text: str) -> float:
        normalized = text.casefold()
        candidates = [company_name, *aliases]
        matched = sum(
            1 for candidate in candidates
            if candidate and re.search(rf"(?<!\w){re.escape(candidate.casefold())}(?!\w)", normalized)
        )
        if matched == 0:
            return 0.0
        return min(1.0, 0.8 + 0.1 * (matched - 1))
