import os
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    """Central configuration for QuoteFlow AI Agent."""
    
    # Database (Neon PostgreSQL)
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_RaxmX3EWiZ2f@ep-billowing-bar-b5f1nxza.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    )
    
    # Google AI Studio / Gemma
    google_api_key: Optional[str] = os.getenv("GOOGLE_API_KEY", "")
    gemma_model: str = (
        os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it") + "-it"
        if os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it").startswith("gemma")
        and not os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it").endswith("-it")
        else os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")
    )
    
    # LangSmith Observability (Latest Standard)
    langsmith_api_key: Optional[str] = os.getenv("LANGSMITH_API_KEY", "")
    langsmith_project: str = os.getenv("LANGSMITH_PROJECT", "QuoteFlow-AI")
    langsmith_tracing: bool = (
        os.getenv("LANGSMITH_TRACING", "false").lower() in ("true", "1")
        and bool(os.getenv("LANGSMITH_API_KEY"))
        and os.getenv("LANGSMITH_API_KEY") != "your-langsmith-api-key"
    )
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure tracing is disabled in environment if no valid API key is set
if not settings.langsmith_tracing:
    os.environ["LANGSMITH_TRACING"] = "false"
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
