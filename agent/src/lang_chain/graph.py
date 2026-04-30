from collections.abc import Sequence
from typing import Any, Protocol, cast

from azure.identity.aio import AzureCliCredential
from langchain_azure_ai.chat_models import AzureAIOpenAIApiChatModel  # type: ignore[import-untyped]
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.graph.state import CompiledStateGraph

from ..config import Settings, get_settings
from ..mfa.agents import ZENITH_INSTRUCTIONS


class ChatModel(Protocol):
    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage: ...


def last_user_text(messages: list[BaseMessage]) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            content = message.content
            return content if isinstance(content, str) else str(content)
    return ""


def build_foundry_chat_model(settings: Settings | None = None) -> BaseChatModel:
    settings = settings or get_settings()
    if not settings.foundry_project_endpoint:
        raise RuntimeError("FOUNDRY_PROJECT_ENDPOINT or AZURE_AI_PROJECT_ENDPOINT is required for the LangGraph agent.")

    return cast(
        BaseChatModel,
        AzureAIOpenAIApiChatModel(
            project_endpoint=settings.foundry_project_endpoint,
            credential=AzureCliCredential(),
            model=settings.openai_model,
            store=False,
        ),
    )


def build_zenith_graph(
    chat_model: ChatModel | None = None,
    *,
    settings: Settings | None = None,
    tools: list[dict[str, Any]] | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    base_model: Any = chat_model or build_foundry_chat_model(settings)

    if tools and hasattr(base_model, "bind_tools"):
        openai_tools = [
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
        model: Any = base_model.bind_tools(openai_tools)
    else:
        model = base_model

    async def call_zenith(state: MessagesState) -> dict[str, list[BaseMessage]]:
        messages = cast(list[BaseMessage], state["messages"])
        response = await model.ainvoke([SystemMessage(content=ZENITH_INSTRUCTIONS), *messages])
        return {"messages": [response]}

    graph = StateGraph(MessagesState)
    graph.add_node("zenith", call_zenith)
    graph.add_edge(START, "zenith")
    graph.add_edge("zenith", END)
    return graph.compile()


def to_lang_chain_message(role: str, content: str) -> BaseMessage | None:
    if role == "user":
        return HumanMessage(content=content)
    if role == "assistant":
        return AIMessage(content=content)
    if role == "system":
        return SystemMessage(content=content)
    return None
