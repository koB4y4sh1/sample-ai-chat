from collections.abc import Awaitable, Callable, Sequence
from typing import Any

from langchain_core.tools import BaseTool

from ..state import AgentState


def build_gather_context_node(
    server_tools: Sequence[BaseTool],
) -> Callable[[AgentState], Awaitable[dict[str, Any]]]:
    async def gather_context(state: AgentState) -> dict[str, Any]:
        tool_names = [tool.name for tool in server_tools]
        if tool_names:
            return {"tool_logs": [f"繝ｪ繧ｯ繧ｨ繧ｹ繝医ｒ蜃ｦ逅・ｸｭ... MCP tools ({len(tool_names)}): {', '.join(tool_names)}"]}
        return {"tool_logs": ["繝ｪ繧ｯ繧ｨ繧ｹ繝医ｒ蜃ｦ逅・ｸｭ..."]}

    return gather_context
