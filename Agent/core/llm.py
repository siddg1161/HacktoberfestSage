"""Centralized LLM Factory for QuoteFlow AI.

Exclusively uses Google AI Studio Multimodal models (Gemini 2.5 Flash / Gemma 4),
supporting native vision (handwritten estimate slips) and voice audio/transcripts.
Provides structured output bindings via Pydantic schemas.
"""

from functools import lru_cache
from typing import Type, Dict
from pydantic import BaseModel
from langchain_core.runnables import Runnable
from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import settings

_model_cache: Dict[float, ChatGoogleGenerativeAI] = {}

def get_base_model(temperature: float = 0.0) -> ChatGoogleGenerativeAI:
    """Returns a cached ChatGoogleGenerativeAI instance using configured Google AI Studio model.
    
    Uses client_args={'http2': False} to prevent Windows [SSL: UNEXPECTED_EOF_WHILE_READING]
    handshake socket drops, and maintains a long-lived client connection pool.
    """
    if temperature in _model_cache:
        return _model_cache[temperature]

    api_key = settings.google_api_key
    if not api_key or api_key == "your-google-api-key-here":
        raise ValueError(
            "[core/llm.py]: GOOGLE_API_KEY is not configured or is using placeholder in .env. "
            "Please provide a valid Google AI Studio key."
        )

    model_instance = ChatGoogleGenerativeAI(
        model=settings.gemma_model,
        google_api_key=api_key,
        temperature=temperature,
        timeout=90.0,
        max_retries=3,
        client_args={
            "http2": False,  # Fixes Windows TLS handshake drops and EOF violations
        }
    )
    _model_cache[temperature] = model_instance
    return model_instance

def get_llm(temperature: float = 0.0) -> Runnable:
    """Returns base LLM runnable for general reasoning and text generation."""
    return get_base_model(temperature=temperature)

def get_structured_llm(schema: Type[BaseModel], temperature: float = 0.0) -> Runnable:
    """Returns an LLM bound to a Pydantic schema for strict structured output.
    
    Ensures Node 1 (ExtractionOutput) and Node 3 (AuditAndProcurementOutput)
    return strictly validated JSON matching the domain schemas.
    """
    model = get_base_model(temperature=temperature)
    return model.with_structured_output(schema)

def get_multimodal_llm(temperature: float = 0.0) -> Runnable:
    """Returns the multimodal LLM instance capable of processing image slips and audio."""
    return get_base_model(temperature=temperature)
