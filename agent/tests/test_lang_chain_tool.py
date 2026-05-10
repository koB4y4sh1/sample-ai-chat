from typing import Any, ClassVar

from langchain_core.tools import tool
from src.config import Settings
from src.lang_chain import tool as lang_chain_tool


@tool
def fake_tool() -> str:
    """Fake tool."""
    return "ok"


class FakeMCPClient:
    configs: ClassVar[list[dict[str, Any]]] = []

    def __init__(self, config: dict[str, Any]) -> None:
        self.configs.append(config)

    async def get_tools(self) -> list[Any]:
        return [fake_tool]


async def test_build_tools_returns_empty_when_mcp_disabled() -> None:
    assert await lang_chain_tool.build_tools(Settings(mcp_enabled=False)) == []


async def test_build_tools_returns_mcp_tools_from_settings(monkeypatch) -> None:
    FakeMCPClient.configs.clear()
    monkeypatch.setattr(lang_chain_tool, "MultiServerMCPClient", FakeMCPClient)

    tools = await lang_chain_tool.build_tools(Settings(mcp_url="http://127.0.0.1:8101/mcp"))

    assert tools == [fake_tool]
    assert FakeMCPClient.configs[0]["zenith"]["url"] == "http://127.0.0.1:8101/mcp"
    assert FakeMCPClient.configs[0]["zenith"]["transport"] == "streamable_http"
