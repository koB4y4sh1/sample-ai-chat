from collections.abc import Sequence
from typing import Any, Protocol

from langchain_core.messages import BaseMessage


class ChatModel(Protocol):
    def bind(self, **kwargs: Any) -> ChatModel: ...

    def bind_tools(self, tools: Sequence[Any], **kwargs: Any) -> ChatModel: ...

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage: ...
