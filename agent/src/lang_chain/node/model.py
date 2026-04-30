from collections.abc import Awaitable, Callable
from typing import Any, cast

from langchain_core.messages import BaseMessage, SystemMessage

from ...mfa.agents import ZENITH_INSTRUCTIONS
from ..state import AgentState, ChatModel

DOCUMENT_REVIEW_INSTRUCTIONS = """
When the user asks for document review, use available MCP tools to fetch document data,
metadata, and insights before producing the review. Include risk signals, key findings,
and recommended actions. Keep the review structured, accurate, concise, and professional.
""".strip()


def build_call_model_node(model: ChatModel) -> Callable[[AgentState], Awaitable[dict[str, Any]]]:
    async def call_model(state: AgentState) -> dict[str, Any]:
        messages = cast(list[BaseMessage], state["messages"])
        response = await model.ainvoke([SystemMessage(content=f"{ZENITH_INSTRUCTIONS}\n\n{DOCUMENT_REVIEW_INSTRUCTIONS}"), *messages])
        current_logs: list[str] = list(state.get("tool_logs") or [])
        return {"messages": [response], "tool_logs": [*current_logs, "Response generated."]}

    return call_model
