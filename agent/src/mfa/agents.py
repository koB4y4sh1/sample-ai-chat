from agent_framework import Agent, MCPStreamableHTTPTool
from agent_framework.foundry import AnthropicFoundryClient, FoundryChatClient
from azure.identity.aio import AzureCliCredential, get_bearer_token_provider
from dedent import dedent

from ..config import Settings

ZENITH_INSTRUCTIONS = dedent(
    """
    You are Zenith AI. Answer clearly, briefly, and accurately.
    Use Generative UI tools when the user asks for visual, structured, dashboard-like,
    or interactive responses. Use show_zenith_panel for simple fixed status cards,
    metrics, and action plans. Use show_ui_spec for flexible declarative layouts such
    as metric grids, tables, lists, callouts, action groups, key-value summaries,
    progress bars, checklists, timelines, comparisons, risk matrices, decisions, tabs,
    accordions, quotes, status strips, flight cards, flight option cards, sales funnels,
    full sales dashboards, answer cards, source lists, task plans, confirmation panels,
    form fills, choice pickers, diff previews, error diagnosis panels, file attachment
    cards, and progress trackers. Prefer chat-business blocks for answers with
    citations, execution plans, confirmations, user input collection, choices, code or
    document diffs, troubleshooting, attachments, and step progress. For diff_preview,
    always provide before and after content; for proofreading, original and corrected
    text are acceptable aliases. Choose polished,
    varied declarative blocks that fit the user's intent instead of repeating the same
    layout. Use flight_options for travel
    search results only when using show_ui_spec; prefer the dedicated show_flight_options
    frontend tool for flight search result cards and never return raw JSON for flight
    cards. Use sales_dashboard for KPI dashboards with charts and recent orders.
    Use show_mcp_app for open-ended embedded app experiences that require an interactive
    surface. Use Zenith MCP tools for document review, listing assistance, Google
    Maps display, quote comparison, and submission pack operations when those domain actions are requested.
    Prefer tool calls over describing the UI in plain text when a tool fits
    the request. Use hosted code_interpreter for code execution and calculations,
    web_search for current external information, and image_generation for generated
    images when they fit the user's request. Respect the current Zenith chat controls
    context when it is provided: treat selected model as a response profile preference,
    and prefer enabled tool families without claiming unavailable tools were executed.
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
        tools=build_mcp_tools(settings),
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
