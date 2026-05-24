from datetime import timedelta

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from ..config import Settings


async def build_tools(settings: Settings) -> list[BaseTool]:
    if not settings.mcp_enabled:
        return []

    client = MultiServerMCPClient(
        {
            "zenith": {
                "transport": "streamable_http",
                "url": settings.mcp_url,
                "timeout": timedelta(seconds=settings.mcp_request_timeout_seconds),
            }
        }
    )
    return await client.get_tools()
