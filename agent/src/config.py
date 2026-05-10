from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

AG_UI_ROOT = Path(__file__).resolve().parents[1]
ENV_FILE_PATH = AG_UI_ROOT / ".env"

load_dotenv(dotenv_path=ENV_FILE_PATH, override=False)

SUPPORTED_MODELS = ("gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano")
MODEL_ALIASES = {"gpt5.4": "gpt-5.4"}
DEFAULT_MODEL = "gpt-5.4-nano"
DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6"
DEFAULT_MCP_URL = "http://127.0.0.1:8101/mcp"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )
    cors_origins: str = "http://127.0.0.1:3000"

    openai_model: str = DEFAULT_MODEL
    anthropic_model: str = DEFAULT_ANTHROPIC_MODEL
    azure_openai_endpoint: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "AZURE_OPENAI_ENDPOINT",
        ),
    )
    foundry_project_endpoint: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "FOUNDRY_PROJECT_ENDPOINT",
            "AZURE_AI_PROJECT_ENDPOINT",
        ),
    )
    mcp_enabled: bool = True
    mcp_url: str = DEFAULT_MCP_URL
    mcp_request_timeout_seconds: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()


def parse_cors_origins(cors_origins: str) -> list[str]:
    return [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
