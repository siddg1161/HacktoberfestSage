"""Root export for Dynamic Prompts.
Delegates to core.prompts to maintain clean modular layout.
"""

from core.prompts import (
    get_prompt,
    reload_prompts,
    get_extractor_prompt,
    get_revenue_guard_prompt,
    LOCAL_FALLBACKS,
)

__all__ = [
    "get_prompt",
    "reload_prompts",
    "get_extractor_prompt",
    "get_revenue_guard_prompt",
    "LOCAL_FALLBACKS",
]
