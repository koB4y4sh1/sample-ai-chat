"""MCP client factory for LangGraph agents (Phase 2-C)."""

from langchain_mcp_adapters.client import MultiServerMCPClient

from ..config import Settings


def build_mcp_client(settings: Settings) -> MultiServerMCPClient | None:
    """Return a configured MultiServerMCPClient, or None when MCP is disabled.

    ``MultiServerMCPClient.get_tools()`` opens the required sessions and returns
    LangChain tools whose executions create MCP sessions on demand.

    Args:
        settings: Application settings that contain the MCP URL and enabled flag.

    Returns:
        A ``MultiServerMCPClient`` instance ready to be used as an async context
        manager, or ``None`` when ``settings.mcp_enabled`` is ``False``.
    """
    if not settings.mcp_enabled:
        return None

    return MultiServerMCPClient(
        {
            "mcp": {
                "transport": "streamable_http",
                "url": settings.mcp_url,
            }
        }
    )
