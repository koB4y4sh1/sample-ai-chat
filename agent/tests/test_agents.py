from agent_framework import MCPStreamableHTTPTool
from src.config import Settings
from src.mfa.agents import build_mcp_tools, build_openai_agent


def test_build_mcp_tools_returns_zenith_streamable_http_tool() -> None:
    tools = build_mcp_tools(Settings(mcp_url="http://127.0.0.1:8101/mcp"))

    assert len(tools) == 1
    assert isinstance(tools[0], MCPStreamableHTTPTool)
    assert tools[0].name == "zenith_mcp"
    assert tools[0].url == "http://127.0.0.1:8101/mcp"
    assert tools[0].approval_mode == "never_require"


def test_build_mcp_tools_can_be_disabled() -> None:
    assert build_mcp_tools(Settings(mcp_enabled=False)) == []


def test_openai_agent_includes_configured_mcp_tool() -> None:
    agent = build_openai_agent(Settings(mcp_url="http://127.0.0.1:8101/mcp"))

    assert len(agent.mcp_tools) == 1
    assert agent.mcp_tools[0].name == "zenith_mcp"
