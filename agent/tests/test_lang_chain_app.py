from collections.abc import Sequence
from typing import Any

from fastapi import FastAPI
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from src.lang_chain import app as lang_chain_app
from src.lang_chain.graph import build_graph


class FakeChatModel:
    def bind(self, **kwargs: Any) -> FakeChatModel:
        return self

    def bind_tools(self, tools: Sequence[Any], **kwargs: Any) -> FakeChatModel:
        return self

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        raise NotImplementedError


def _last_user_text(messages: Sequence[BaseMessage]) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


class EchoChatModel(FakeChatModel):
    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        return AIMessage(content=f"LangGraph agent received: {_last_user_text(input)}")


class ToolBindingChatModel(EchoChatModel):
    def __init__(self) -> None:
        self.bound_tool_names: list[str] = []

    def bind_tools(self, tools: Sequence[Any], **kwargs: Any) -> ToolBindingChatModel:
        self.bound_tool_names = [tool.get("function", {}).get("name") if isinstance(tool, dict) else getattr(tool, "name", "") for tool in tools]
        return self


class ServerToolCallingChatModel(FakeChatModel):
    def __init__(self) -> None:
        self._call_count = 0

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        if self._call_count == 0:
            self._call_count += 1
            return AIMessage(
                content="",
                tool_calls=[
                    {
                        "id": "server_tool_1",
                        "name": "mock_doc_tool",
                        "args": {"doc_id": "D001"},
                        "type": "tool_call",
                    }
                ],
            )

        return AIMessage(content="Review complete based on MCP data.")


@tool
def mock_doc_tool(doc_id: str) -> str:
    """Fetch document data for review."""
    return f"Document {doc_id}: contents retrieved."


def _initial_state(message: str = "hello") -> dict[str, Any]:
    return {
        "messages": [HumanMessage(content=message)],
        "copilotkit": {"actions": [], "context": []},
    }


def test_create_lang_chain_app_exposes_health_endpoint() -> None:
    app = lang_chain_app.create_app(graph=build_graph(EchoChatModel()))

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "agent_runtime": "lang-chain"}


def test_lang_chain_app_streams_through_langgraph_adapter() -> None:
    app = lang_chain_app.create_app(chat_model=EchoChatModel(), server_tools=[])

    with TestClient(app) as client:
        response = client.post(
            "/ag-ui",
            json={
                "threadId": "test-thread",
                "runId": "test-run",
                "state": {},
                "messages": [{"id": "user-message", "role": "user", "content": "hello"}],
                "tools": [],
                "context": [],
                "forwardedProps": {},
            },
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert '"type":"RUN_STARTED"' in response.text
    assert '"type":"RUN_FINISHED"' in response.text
    assert "LangGraph agent received: hello" in response.text


def test_mounted_lang_chain_app_exposes_ag_ui_endpoint() -> None:
    app = FastAPI()
    app.mount("/lang-chain", lang_chain_app.create_app(chat_model=EchoChatModel(), server_tools=[]))

    with TestClient(app) as client:
        response = client.post(
            "/lang-chain/ag-ui",
            json={
                "threadId": "test-thread",
                "runId": "test-run",
                "state": {},
                "messages": [{"id": "user-message", "role": "user", "content": "hello"}],
                "tools": [],
                "context": [],
                "forwardedProps": {},
            },
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")


def test_create_lang_chain_app_loads_server_tools_from_settings(monkeypatch) -> None:
    loaded_settings: list[object] = []

    async def fake_build_tools(settings: object) -> list[Any]:
        loaded_settings.append(settings)
        return [mock_doc_tool]

    monkeypatch.setattr(lang_chain_app, "build_tools", fake_build_tools)

    app = lang_chain_app.create_app(
        chat_model=ServerToolCallingChatModel(),
        settings=lang_chain_app.Settings(mcp_url="http://127.0.0.1:8101/mcp"),
    )

    assert len(loaded_settings) == 1

    with TestClient(app) as client:
        response = client.post(
            "/ag-ui",
            json={
                "threadId": "review-thread",
                "runId": "review-run",
                "state": {},
                "messages": [{"id": "user-message", "role": "user", "content": "review doc D001"}],
                "tools": [],
                "context": [],
                "forwardedProps": {},
            },
        )

    assert response.status_code == 200
    assert "Review complete" in response.text


def test_create_lang_chain_app_registers_langgraph_ag_ui_endpoint(monkeypatch) -> None:
    registered: list[dict[str, object]] = []

    class FakeLangGraphAGUIAgent:
        def __init__(self, **kwargs: object) -> None:
            self.kwargs = kwargs

    monkeypatch.setattr(lang_chain_app, "LangGraphAGUIAgent", FakeLangGraphAGUIAgent)
    monkeypatch.setattr(
        lang_chain_app,
        "add_langgraph_fastapi_endpoint",
        lambda app, agent, path: registered.append({"app": app, "agent": agent, "path": path}),
    )

    app = lang_chain_app.create_app(graph=build_graph(EchoChatModel()))

    assert len(registered) == 1
    assert registered[0]["app"] is app
    assert registered[0]["path"] == "/ag-ui"
    agent = registered[0]["agent"]
    assert isinstance(agent, FakeLangGraphAGUIAgent)
    assert agent.kwargs["name"] == "sample_agent"
    assert agent.kwargs["description"]
    assert agent.kwargs["graph"] is not None


async def test_lang_graph_returns_assistant_message() -> None:
    graph = build_graph(EchoChatModel())

    result = await graph.ainvoke(_initial_state())

    assert isinstance(result["messages"][-1], AIMessage)
    assert "hello" in str(result["messages"][-1].content)


async def test_create_lang_chain_app_can_load_tools_inside_running_event_loop(monkeypatch) -> None:
    loaded_settings: list[object] = []

    async def fake_build_tools(settings: object) -> list[Any]:
        loaded_settings.append(settings)
        return []

    monkeypatch.setattr(lang_chain_app, "build_tools", fake_build_tools)

    app = lang_chain_app.create_app(chat_model=EchoChatModel())

    assert app is not None
    assert len(loaded_settings) == 1


def test_lang_graph_uses_langchain_agent_nodes() -> None:
    graph = build_graph(EchoChatModel()).get_graph()

    assert {"__start__", "model", "__end__"}.issubset(graph.nodes)


async def test_copilotkit_frontend_tools_are_bound_to_model() -> None:
    chat_model = ToolBindingChatModel()
    graph = build_graph(chat_model)

    await graph.ainvoke(
        {
            "messages": [HumanMessage(content="show me flights")],
            "copilotkit": {
                "actions": [
                    {
                        "type": "function",
                        "function": {
                            "name": "show_flight_options",
                            "description": "Display flight options",
                            "parameters": {"type": "object", "properties": {}},
                        },
                    }
                ],
                "context": [],
            },
        }
    )

    assert "show_flight_options" in chat_model.bound_tool_names


async def test_zenith_graph_executes_server_side_tools() -> None:
    graph = build_graph(ServerToolCallingChatModel(), server_tools=[mock_doc_tool])

    result = await graph.ainvoke(_initial_state("review doc D001"))

    messages = result["messages"]
    tool_messages = [message for message in messages if isinstance(message, ToolMessage)]
    assert len(tool_messages) == 1
    assert "D001" in str(tool_messages[0].content)
    assert isinstance(messages[-1], AIMessage)
    assert "Review complete" in str(messages[-1].content)
