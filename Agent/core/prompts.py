"""Dynamic Prompt Loader for QuoteFlow AI connecting to LangSmith Prompt Hub.

Pulls version-controlled prompts from LangSmith Hub dynamically.
Supports in-memory LRU caching to avoid redundant network round-trips,
with automatic fallback to local templates if offline or API key is absent.
Includes `reload_prompts()` to clear the LRU cache whenever prompts are updated.
"""

from typing import Dict, Optional
from functools import lru_cache
import logging

from langsmith import Client
from langchain_core.prompts import ChatPromptTemplate
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize Singleton LangSmith Client
_client: Optional[Client] = None

def get_langsmith_client() -> Client:
    """Get or initialize singleton LangSmith client."""
    global _client
    if _client is None:
        _client = Client(
            api_key=settings.langsmith_api_key or None
        )
    return _client

# -------------------------------------------------------------------------
# Local Fallback Templates (Offline / Network Error Resilience)
# -------------------------------------------------------------------------
LOCAL_FALLBACKS: Dict[str, ChatPromptTemplate] = {
    "quoteflow-extractor": ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert Indian electrical and building material quotation specialist. "
            "Your job is to reconcile handwritten estimate slips ('parchis') and Hinglish voice notes, "
            "and accurately match each requested line item to the provided catalog SKUs.\n\n"
            "RULES:\n"
            "1. Prioritize Hinglish voice notes if handwritten text is unclear, smudged, or ambiguous.\n"
            "2. Map every item to the closest catalog 'sku_id'. If completely unknown, invent a temporary SKU with prefix 'UNMAPPED-'.\n"
            "3. Parse quantities carefully (e.g. '5 coil', '10 switches', '3 pipes').\n"
            "4. Detect the client or contractor's name if stated in the slip header or voice audio.\n\n"
            "AVAILABLE CATALOG SKUs:\n"
            "{catalog_summary}"
        ),
        (
            "human",
            "Client Name Hint: {client_name_hint}\n"
            "Voice Transcript (Hinglish): {voice_transcript}\n"
            "{image_reference}"
        )
    ]),
    "quoteflow-revenue-guard": ChatPromptTemplate.from_messages([
        (
            "system",
            "You are the QuoteFlow AI Revenue Guard.\n"
            "Your job is to audit quoted line items and identify missing companion services, installation labor, or critical fittings/accessories from the catalog.\n\n"
            "RULES:\n"
            "1. Carefully analyze what materials/hardware are being quoted (e.g., wire coils, switches, conduit pipes).\n"
            "2. Cross-reference with the provided AVAILABLE COMPANION SERVICES.\n"
            "3. If materials require installation or complementary accessories that are missing from the quote, suggest the appropriate companion SKU(s) with recommended quantity and concise justification.\n"
            "4. Do not perform math or pricing calculations; simply recommend the SKU ID, display name, suggested quantity, and reason.\n\n"
            "AVAILABLE COMPANION SERVICES & ACCESSORIES:\n"
            "{available_services}"
        ),
        (
            "human",
            "Quoted Items to Audit:\n"
            "{quoted_items_summary}"
        )
    ]),
}

# -------------------------------------------------------------------------
# Dynamic Prompt Fetcher with LRU Cache
# -------------------------------------------------------------------------
@lru_cache(maxsize=32)
def get_prompt(prompt_name: str) -> ChatPromptTemplate:
    """Pulls a versioned prompt from LangSmith Prompt Hub.
    
    Uses in-memory LRU caching to eliminate per-turn network latency.
    Falls back gracefully to local definition if network or API key fails.
    """
    if settings.langsmith_api_key and settings.langsmith_api_key != "your-langsmith-api-key":
        try:
            client = get_langsmith_client()
            prompt = client.pull_prompt(prompt_name)
            if isinstance(prompt, ChatPromptTemplate):
                return prompt
        except Exception as e:
            logger.warning(
                "[core/prompts.py]: Failed to pull '%s' from LangSmith Hub (%s). Using local fallback.",
                prompt_name, e
            )

    fallback = LOCAL_FALLBACKS.get(prompt_name)
    if fallback is None:
        raise ValueError(f"[core/prompts.py]: Prompt '{prompt_name}' not found in LangSmith Hub or local fallbacks.")
    return fallback

def reload_prompts() -> None:
    """Clears the LRU cache so modified prompts from LangSmith Hub are fetched immediately."""
    get_prompt.cache_clear()
    logger.info("[core/prompts.py]: Prompt LRU cache cleared successfully.")

# Convenient helper accessors
def get_extractor_prompt() -> ChatPromptTemplate:
    """Returns the Multimodal Extractor prompt template (from Hub or fallback)."""
    return get_prompt("quoteflow-extractor")

def get_revenue_guard_prompt() -> ChatPromptTemplate:
    """Returns the Revenue Guard audit prompt template (from Hub or fallback)."""
    return get_prompt("quoteflow-revenue-guard")
