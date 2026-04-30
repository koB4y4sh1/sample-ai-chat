from collections.abc import Callable, Mapping
from typing import cast

from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.tools import BaseTool
from langgraph.graph import END

from ..state import AgentState


def build_should_continue_node(
    server_tools_by_name: Mapping[str, BaseTool],
) -> Callable[[AgentState], str]:
    def should_continue(state: AgentState) -> str:
        messages = cast(list[BaseMessage], state["messages"])
        last = messages[-1] if messages else None
        if not isinstance(last, AIMessage) or not last.tool_calls:
            return END

        if any((tool_call.get("name") or "") in server_tools_by_name for tool_call in last.tool_calls):
            return "execute_server_tools"

        return END

    return should_continue
