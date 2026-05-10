from typing import cast

from azure.identity.aio import AzureCliCredential
from langchain_azure_ai.chat_models import AzureAIOpenAIApiChatModel  # type: ignore[import-untyped]
from langchain_core.language_models.chat_models import BaseChatModel

from src.config import Settings, get_settings


def build_foundry_chat_model(settings: Settings | None = None) -> BaseChatModel:
    settings = settings or get_settings()
    if not settings.foundry_project_endpoint:
        raise RuntimeError("FOUNDRY_PROJECT_ENDPOINT が設定されていません。環境変数を確認してください。")

    return cast(
        BaseChatModel,
        AzureAIOpenAIApiChatModel(
            project_endpoint=settings.foundry_project_endpoint,
            credential=AzureCliCredential(),
            model=settings.openai_model,
            reasoning={
                "effort": "medium",  # low | medium | high など。モデル依存
                "summary": "auto",  # auto | concise | detailed
            },
            store=False,
        ),
    )
