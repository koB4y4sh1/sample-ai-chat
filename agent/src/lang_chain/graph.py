from typing import Any, cast

from copilotkit import CopilotKitMiddleware, CopilotKitState
from langchain.agents import create_agent
from langchain_core.tools import BaseTool
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph.state import CompiledStateGraph

from src.lang_chain.model import build_foundry_chat_model

from ..config import Settings
from .state import ChatModel

INSTRUCTIONS = """
When the user asks for document review, use available MCP tools to fetch document data,
metadata, and insights before producing the review. Include risk signals, key findings,
and recommended actions. Keep the review structured, accurate, concise, and professional.
""".strip()


def build_graph(
    chat_model: ChatModel | None = None,
    *,
    settings: Settings | None = None,
    server_tools: list[BaseTool] | None = None,
    checkpointer: BaseCheckpointSaver[Any] | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    model: Any = chat_model or build_foundry_chat_model(settings)

    return create_agent(
        model=model,
        tools=list(server_tools or []),
        middleware=[CopilotKitMiddleware()],
        system_prompt=INSTRUCTIONS,
        checkpointer=checkpointer,
        state_schema=cast(Any, CopilotKitState),
    )
