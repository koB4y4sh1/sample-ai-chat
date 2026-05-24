from agent_framework import Agent
from agent_framework.foundry import AnthropicFoundryClient, FoundryChatClient
from azure.identity.aio import AzureCliCredential, get_bearer_token_provider
from dedent import dedent

from src.mfa.tool import build_mcp_tools, mfa_get_weather

from ..config import Settings

INSTRUCTIONS = dedent(
    """
    You are Zenith AI. Answer clearly, briefly, and accurately.
    """
).strip()


def build_openai_agent(settings: Settings, *, model: str | None = None) -> Agent:
    return Agent(
        name="mfa-openai",
        instructions=INSTRUCTIONS,
        client=FoundryChatClient(model=model or settings.openai_model, credential=AzureCliCredential()),
        tools=[mfa_get_weather, *build_mcp_tools(settings)],
        default_options={"store": False},
    )


def build_anthropic_agent(settings: Settings, *, model: str | None = None) -> Agent:
    token_provider = get_bearer_token_provider(
        AzureCliCredential(),
        "https://ai.azure.com/.default",
    )
    return Agent(
        name="mfa-anthropic",
        instructions=INSTRUCTIONS,
        client=AnthropicFoundryClient(
            model=model or settings.anthropic_model,
            azure_ad_token_provider=token_provider,
        ),
    )
