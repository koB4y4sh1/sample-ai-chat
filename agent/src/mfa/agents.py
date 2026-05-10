from agent_framework import Agent, MCPStreamableHTTPTool
from agent_framework.foundry import AnthropicFoundryClient, FoundryChatClient
from azure.identity.aio import AzureCliCredential, get_bearer_token_provider
from dedent import dedent

from src.mfa.tool import get_weather

from ..config import Settings

ZENITH_INSTRUCTIONS = dedent(
    """
    You are Zenith AI. Answer clearly, briefly, and accurately.
    """
).strip()


def build_mcp_tools(settings: Settings) -> list[MCPStreamableHTTPTool]:
    if not settings.mcp_enabled:
        return []

    return [
        MCPStreamableHTTPTool(
            name="zenith_mcp",
            description="Zenith MCP domain tools for document review, listing assist, Google Maps display, quote comparison, and submission packs.",
            url=settings.mcp_url,
            approval_mode="never_require",
            request_timeout=settings.mcp_request_timeout_seconds,
        )
    ]


def build_openai_agent(settings: Settings, *, model: str | None = None) -> Agent:
    return Agent(
        name="zenith",
        instructions=ZENITH_INSTRUCTIONS,
        client=FoundryChatClient(model=model or settings.openai_model, credential=AzureCliCredential()),
        tools=[get_weather, *build_mcp_tools(settings)],
        default_options={"store": False},
    )


def build_anthropic_agent(settings: Settings, *, model: str | None = None) -> Agent:
    token_provider = get_bearer_token_provider(
        AzureCliCredential(),
        "https://ai.azure.com/.default",
    )
    return Agent(
        name="zenith-anthropic",
        instructions=ZENITH_INSTRUCTIONS,
        client=AnthropicFoundryClient(
            model=model or settings.anthropic_model,
            azure_ad_token_provider=token_provider,
        ),
    )
