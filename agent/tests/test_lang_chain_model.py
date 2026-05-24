from typing import Any

from src.config import Settings
from src.lang_chain import model as lang_chain_model


def test_build_foundry_chat_model_requests_encrypted_reasoning_for_stateless_runs(
    monkeypatch,
) -> None:
    captured_kwargs: dict[str, Any] = {}

    class FakeCredential:
        pass

    class FakeAzureChatModel:
        def __init__(self, **kwargs: Any) -> None:
            captured_kwargs.update(kwargs)

    monkeypatch.setattr(lang_chain_model, "AzureCliCredential", FakeCredential)
    monkeypatch.setattr(lang_chain_model, "AzureAIOpenAIApiChatModel", FakeAzureChatModel)

    lang_chain_model.build_foundry_chat_model(
        Settings(
            foundry_project_endpoint="https://example.services.ai.azure.com/api/projects/project",
            openai_model="gpt-5.4-nano",
        )
    )

    assert captured_kwargs["store"] is False
    assert captured_kwargs["include"] == ["reasoning.encrypted_content"]
