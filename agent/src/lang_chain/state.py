from collections.abc import Sequence
from typing import Annotated, Any, Protocol

from langchain_core.messages import BaseMessage
from langgraph.graph import MessagesState


class ChatModel(Protocol):
    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage: ...


class AgentState(MessagesState):
    tool_logs: Annotated[list[str], lambda a, b: b]
