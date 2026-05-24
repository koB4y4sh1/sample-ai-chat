from __future__ import annotations

from random import randint
from typing import Annotated

from agent_framework import MCPStreamableHTTPTool, tool

from ..config import Settings


# Example: Function tool
@tool(approval_mode="always_require")
def mfa_get_weather(
    location: Annotated[str, "Weather target city such as Tokyo, New York, Paris"],
) -> str:
    conditions = ["sunny", "cloudy", "rainy", "stormy"]
    return f"{location} weather is {conditions[randint(0, 3)]}, approx. {randint(10, 30)}C."  # noqa: S311


# Example: MCP Tools (/mcp directory)
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
