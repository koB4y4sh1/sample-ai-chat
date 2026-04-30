from typing import Any, cast

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import BaseTool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from src.lang_chain.model import build_foundry_chat_model

from ..config import Settings
from .node.context import build_gather_context_node
from .node.model import build_call_model_node
from .node.router import build_should_continue_node
from .node.server_tools import build_execute_server_tools_node
from .state import AgentState, ChatModel


def last_user_text(messages: list[BaseMessage]) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            content = message.content
            return content if isinstance(content, str) else str(content)
    return ""


def build_graph(
    chat_model: ChatModel | None = None,
    *,
    settings: Settings | None = None,
    tools: list[dict[str, Any]] | None = None,
    server_tools: list[BaseTool] | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    base_model: Any = chat_model or build_foundry_chat_model(settings)
    server_tools = list(server_tools or [])
    server_tools_by_name = {tool.name: tool for tool in server_tools}
    frontend_tools: list[dict[str, Any]] = []

    if tools:
        frontend_tools = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": t.get("parameters") or {"type": "object", "properties": {}},
                },
            }
            for t in tools
        ]

    if (frontend_tools or server_tools) and hasattr(base_model, "bind_tools"):
        model: Any = base_model.bind_tools([*server_tools, *frontend_tools])
    else:
        model = base_model

    gather_context = build_gather_context_node(server_tools)
    call_model = build_call_model_node(model)

    graph: StateGraph[Any, Any, Any] = StateGraph(AgentState)
    graph.add_node("gather_context", cast(Any, gather_context))
    graph.add_node("call_model", cast(Any, call_model))
    graph.add_edge(START, "gather_context")
    graph.add_edge("gather_context", "call_model")
    if server_tools:
        execute_server_tools = build_execute_server_tools_node(server_tools_by_name)
        should_continue = build_should_continue_node(server_tools_by_name)
        graph.add_node("execute_server_tools", cast(Any, execute_server_tools))
        graph.add_conditional_edges("call_model", cast(Any, should_continue), ["execute_server_tools", END])
        graph.add_edge("execute_server_tools", "call_model")
    else:
        graph.add_edge("call_model", END)
    return graph.compile()


def to_lang_chain_message(role: str, content: str) -> BaseMessage | None:
    if role == "user":
        return HumanMessage(content=content)
    if role == "assistant":
        return AIMessage(content=content)
    if role == "system":
        return SystemMessage(content=content)
    return None
