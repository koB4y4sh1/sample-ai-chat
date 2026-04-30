from collections.abc import Awaitable, Callable, Mapping
from typing import Any, cast

from langchain_core.messages import AIMessage, BaseMessage, ToolMessage
from langchain_core.tools import BaseTool

from ..state import AgentState


def build_execute_server_tools_node(
    server_tools_by_name: Mapping[str, BaseTool],
) -> Callable[[AgentState], Awaitable[dict[str, Any]]]:
    async def execute_server_tools(state: AgentState) -> dict[str, Any]:
        messages = cast(list[BaseMessage], state["messages"])
        last = messages[-1] if messages else None
        if not isinstance(last, AIMessage) or not last.tool_calls:
            return {}

        tool_messages: list[ToolMessage] = []
        log_entries: list[str] = []

        for tool_call in last.tool_calls:
            tool_name = tool_call.get("name") or ""
            tool_call_id = tool_call.get("id")
            tool = server_tools_by_name.get(tool_name)
            if tool is None or not tool_call_id:
                continue

            try:
                result = await tool.ainvoke(tool_call.get("args") or {})
            except Exception as exc:
                result_text = f"{type(exc).__name__}: {exc}"
                tool_messages.append(ToolMessage(content=result_text, tool_call_id=tool_call_id, status="error"))
                log_entries.append(f"MCP: {tool_name} -> ERROR: {result_text[:80]}")
                continue

            result_text = str(result)
            tool_messages.append(ToolMessage(content=result_text, tool_call_id=tool_call_id, status="success"))
            log_entries.append(f"MCP: {tool_name} -> {result_text[:80]}")

        current_logs: list[str] = list(state.get("tool_logs") or [])
        return {"messages": tool_messages, "tool_logs": [*current_logs, *log_entries]}

    return execute_server_tools
