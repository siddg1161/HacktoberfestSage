"""Root export for Centralized LLM Factory.
Delegates to core.llm to prevent duplicate LLM instances.
"""

from core.llm import (
    get_base_model,
    get_llm,
    get_structured_llm,
    get_multimodal_llm,
)

__all__ = [
    "get_base_model",
    "get_llm",
    "get_structured_llm",
    "get_multimodal_llm",
]
