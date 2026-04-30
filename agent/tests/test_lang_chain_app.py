import json
from collections.abc import Sequence
from typing import Any

from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from src.lang_chain import app as lang_chain_app
from src.lang_chain.graph import build_graph, last_user_text


class EchoChatModel:
    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        return AIMessage(content=f"LangGraph agent received: {last_user_text(list(input))}")


class ToolCallChatModel:
    """Always responds with a single frontend tool call."""

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        return AIMessage(
            content="",
            tool_calls=[
                {
                    "id": "call_abc123",
                    "name": "show_flight_options",
                    "args": {"origin": "JFK", "destination": "LAX"},
                    "type": "tool_call",
                }
            ],
        )


class ServerToolCallingChatModel:
    """First call emits a server-side MCP tool call. Second call returns text."""

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


class CapturingChatModel:
    """Records every message passed to ainvoke."""

    def __init__(self) -> None:
        self.received: list[BaseMessage] = []

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        self.received.extend(input)
        return AIMessage(content="done")


def _sse_events(text: str) -> list[dict[str, object]]:
    return [json.loads(line.removeprefix("data: ")) for line in text.splitlines() if line.startswith("data: ")]


@tool
def mock_doc_tool(doc_id: str) -> str:
    """Fetch document data for review."""
    return f"Document {doc_id}: contents retrieved."


@tool("mock_doc_tool")
def failing_doc_tool(doc_id: str) -> str:
    """Fetch document data for review and fail."""
    raise RuntimeError(f"Document {doc_id} is unavailable")


def test_create_lang_chain_app_exposes_health_endpoint() -> None:
    app = lang_chain_app.create_app()

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "agent_runtime": "lang-chain"}


async def test_lang_graph_returns_assistant_message() -> None:
    graph = build_graph(EchoChatModel())

    result = await graph.ainvoke({"messages": [HumanMessage(content="hello")]})

    assert isinstance(result["messages"][-1], AIMessage)
    assert "hello" in str(result["messages"][-1].content)


def test_lang_chain_agent_streams_ag_ui_events() -> None:
    app = lang_chain_app.create_app(graph=build_graph(EchoChatModel()))

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "test-thread",
                "runId": "test-run",
                "state": {},
                "messages": [
                    {
                        "id": "user-message",
                        "role": "user",
                        "content": "hello",
                    }
                ],
            },
        )

    assert response.status_code == 200
    events = _sse_events(response.text)
    assert [event["type"] for event in events] == [
        "RUN_STARTED",
        "TEXT_MESSAGE_START",
        "TEXT_MESSAGE_CONTENT",
        "TEXT_MESSAGE_END",
        "STATE_SNAPSHOT",
        "RUN_FINISHED",
    ]
    assert events[2]["delta"]
    assert "hello" in str(events[-1]["result"])


def test_run_started_input_includes_tools_and_context() -> None:
    app = lang_chain_app.create_app(graph=build_graph(EchoChatModel()))

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "test-thread",
                "runId": "test-run",
                "state": {},
                "messages": [{"id": "u1", "role": "user", "content": "hi"}],
                "tools": [],
                "context": [],
            },
        )

    events = _sse_events(response.text)
    run_started = next(e for e in events if e["type"] == "RUN_STARTED")
    assert isinstance(run_started["input"]["tools"], list)
    assert isinstance(run_started["input"]["context"], list)


def test_frontend_tool_call_emits_tool_call_events() -> None:
    app = lang_chain_app.create_app(chat_model=ToolCallChatModel())

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "t1",
                "messages": [{"id": "u1", "role": "user", "content": "show me flights"}],
                "tools": [
                    {
                        "name": "show_flight_options",
                        "description": "Display flight options",
                        "parameters": {"type": "object", "properties": {}},
                    }
                ],
                "context": [],
            },
        )

    assert response.status_code == 200
    events = _sse_events(response.text)
    types = [e["type"] for e in events]
    assert "TOOL_CALL_START" in types
    assert "TOOL_CALL_ARGS" in types
    assert "TOOL_CALL_END" in types

    start = next(e for e in events if e["type"] == "TOOL_CALL_START")
    assert start["toolCallName"] == "show_flight_options"
    assert start["toolCallId"] == "call_abc123"
    assert start["parentMessageId"]


def test_lang_chain_app_loads_mcp_tools_into_graph(monkeypatch) -> None:
    class FakeMCPClient:
        async def get_tools(self) -> list[Any]:
            return [mock_doc_tool]

    monkeypatch.setattr(lang_chain_app, "build_mcp_client", lambda settings: FakeMCPClient())

    app = lang_chain_app.create_app(chat_model=ServerToolCallingChatModel())

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "review-thread",
                "messages": [{"id": "u1", "role": "user", "content": "review doc D001"}],
            },
        )

    assert response.status_code == 200
    events = _sse_events(response.text)
    snapshot = next(e for e in events if e["type"] == "STATE_SNAPSHOT")
    tool_logs = snapshot["snapshot"]["tool_logs"]
    assert any(entry.startswith("MCP:") and "mock_doc_tool" in entry for entry in tool_logs)
    assert "Review complete" in str(events[-1]["result"])


def test_server_tool_result_is_returned_in_ag_ui_history(monkeypatch) -> None:
    class FakeMCPClient:
        async def get_tools(self) -> list[Any]:
            return [mock_doc_tool]

    monkeypatch.setattr(lang_chain_app, "build_mcp_client", lambda settings: FakeMCPClient())

    app = lang_chain_app.create_app(chat_model=ServerToolCallingChatModel())

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "review-thread",
                "messages": [{"id": "u1", "role": "user", "content": "review doc D001"}],
            },
        )

    assert response.status_code == 200
    events = _sse_events(response.text)
    event_types = [event["type"] for event in events]
    tool_start_index = event_types.index("TOOL_CALL_START")
    tool_args_index = event_types.index("TOOL_CALL_ARGS")
    tool_end_index = event_types.index("TOOL_CALL_END")
    tool_result_index = event_types.index("TOOL_CALL_RESULT")
    tool_parent_start_index = next(
        index
        for index, event in enumerate(events)
        if event["type"] == "TEXT_MESSAGE_START" and event["messageId"] == events[tool_start_index]["parentMessageId"]
    )
    assert tool_parent_start_index < tool_start_index < tool_args_index < tool_end_index < tool_result_index

    tool_result = next(e for e in events if e["type"] == "TOOL_CALL_RESULT")
    assert tool_result["role"] == "tool"
    assert tool_result["toolCallId"] == "server_tool_1"
    assert "D001" in str(tool_result["content"])

    messages_snapshot = next(e for e in events if e["type"] == "MESSAGES_SNAPSHOT")
    messages = messages_snapshot["messages"]
    assert [message["role"] for message in messages] == ["user", "assistant", "tool", "assistant"]
    assert messages[1]["toolCalls"][0]["id"] == "server_tool_1"
    assert messages[2]["toolCallId"] == "server_tool_1"
    assert "Review complete" in messages[3]["content"]

    state_snapshot = next(e for e in events if e["type"] == "STATE_SNAPSHOT")
    state_messages = state_snapshot["snapshot"]["messages"]
    assert [message["role"] for message in state_messages] == ["user", "assistant", "tool", "assistant"]
    assert state_messages[1]["toolCalls"][0]["id"] == "server_tool_1"
    assert state_messages[2]["toolCallId"] == "server_tool_1"


def test_server_tool_error_result_is_returned_in_ag_ui_history(monkeypatch) -> None:
    class FakeMCPClient:
        async def get_tools(self) -> list[Any]:
            return [failing_doc_tool]

    monkeypatch.setattr(lang_chain_app, "build_mcp_client", lambda settings: FakeMCPClient())

    app = lang_chain_app.create_app(chat_model=ServerToolCallingChatModel())

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "review-thread",
                "messages": [{"id": "u1", "role": "user", "content": "review doc D001"}],
            },
        )

    assert response.status_code == 200
    events = _sse_events(response.text)
    tool_result = next(e for e in events if e["type"] == "TOOL_CALL_RESULT")
    assert tool_result["role"] == "tool"
    assert tool_result["toolCallId"] == "server_tool_1"
    assert tool_result["status"] == "error"
    assert "Document D001 is unavailable" in str(tool_result["content"])


def test_lang_chain_app_lazily_loads_mcp_tools_without_lifespan(monkeypatch) -> None:
    class FakeMCPClient:
        async def get_tools(self) -> list[Any]:
            return [mock_doc_tool]

    monkeypatch.setattr(lang_chain_app, "build_mcp_client", lambda settings: FakeMCPClient())

    app = lang_chain_app.create_app(chat_model=ServerToolCallingChatModel())

    client = TestClient(app)
    try:
        response = client.post(
            "/",
            json={
                "threadId": "review-thread",
                "messages": [{"id": "u1", "role": "user", "content": "review doc D001"}],
            },
        )
    finally:
        client.close()

    assert response.status_code == 200
    events = _sse_events(response.text)
    snapshot = next(e for e in events if e["type"] == "STATE_SNAPSHOT")
    tool_logs = snapshot["snapshot"]["tool_logs"]
    assert any(entry.startswith("MCP:") and "mock_doc_tool" in entry for entry in tool_logs)


def test_orphan_tool_calls_are_not_passed_to_model() -> None:
    capturing = CapturingChatModel()
    app = lang_chain_app.create_app(chat_model=capturing)

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "t1",
                "messages": [
                    {"id": "u1", "role": "user", "content": "first"},
                    {
                        "id": "a1",
                        "role": "assistant",
                        "content": None,
                        "toolCalls": [
                            {
                                "id": "orphan_call",
                                "type": "function",
                                "function": {
                                    "name": "mock_doc_tool",
                                    "arguments": '{"doc_id":"D001"}',
                                },
                            }
                        ],
                    },
                    {"id": "u2", "role": "user", "content": "next"},
                ],
            },
        )

    assert response.status_code == 200
    assert not any(isinstance(m, AIMessage) and m.tool_calls for m in capturing.received)


def test_tool_result_messages_are_passed_to_model() -> None:
    capturing = CapturingChatModel()
    app = lang_chain_app.create_app(chat_model=capturing)

    with TestClient(app) as client:
        client.post(
            "/",
            json={
                "threadId": "t1",
                "messages": [
                    {"id": "u1", "role": "user", "content": "show me flights"},
                    {
                        "id": "a1",
                        "role": "assistant",
                        "content": None,
                        "toolCalls": [
                            {
                                "id": "call_1",
                                "type": "function",
                                "function": {
                                    "name": "show_flight_options",
                                    "arguments": "{}",
                                },
                            }
                        ],
                    },
                    {
                        "id": "tr1",
                        "role": "tool",
                        "content": "flights found",
                        "toolCallId": "call_1",
                    },
                ],
                "tools": [],
                "context": [],
            },
        )

    tool_msgs = [m for m in capturing.received if isinstance(m, ToolMessage)]
    assert len(tool_msgs) == 1
    assert tool_msgs[0].tool_call_id == "call_1"
    assert tool_msgs[0].content == "flights found"


async def test_zenith_graph_state_includes_tool_logs() -> None:
    graph = build_graph(EchoChatModel())

    result = await graph.ainvoke({"messages": [HumanMessage(content="hello")], "tool_logs": []})

    assert "tool_logs" in result
    assert isinstance(result["tool_logs"], list)
    assert len(result["tool_logs"]) > 0


async def test_zenith_graph_executes_server_side_mcp_tools() -> None:
    graph = build_graph(ServerToolCallingChatModel(), server_tools=[mock_doc_tool])

    result = await graph.ainvoke({"messages": [HumanMessage(content="review doc D001")], "tool_logs": []})

    messages = result["messages"]
    tool_messages = [m for m in messages if isinstance(m, ToolMessage)]
    assert len(tool_messages) == 1
    assert "D001" in str(tool_messages[0].content)
    assert isinstance(messages[-1], AIMessage)
    assert "Review complete" in str(messages[-1].content)
    assert any(entry.startswith("MCP:") and "mock_doc_tool" in entry for entry in result["tool_logs"])


async def test_zenith_graph_returns_error_tool_message_when_server_tool_fails() -> None:
    graph = build_graph(ServerToolCallingChatModel(), server_tools=[failing_doc_tool])

    result = await graph.ainvoke({"messages": [HumanMessage(content="review doc D001")], "tool_logs": []})

    tool_messages = [m for m in result["messages"] if isinstance(m, ToolMessage)]
    assert len(tool_messages) == 1
    assert tool_messages[0].status == "error"
    assert "Document D001 is unavailable" in str(tool_messages[0].content)
    assert any(entry.startswith("MCP:") and "mock_doc_tool" in entry and "ERROR" in entry for entry in result["tool_logs"])


def test_state_snapshot_includes_tool_logs() -> None:
    app = lang_chain_app.create_app(graph=build_graph(EchoChatModel()))

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "test-thread",
                "messages": [{"id": "u1", "role": "user", "content": "hello"}],
            },
        )

    events = _sse_events(response.text)
    snapshot = next(e for e in events if e["type"] == "STATE_SNAPSHOT")
    assert "tool_logs" in snapshot["snapshot"]
    assert isinstance(snapshot["snapshot"]["tool_logs"], list)


class ErrorChatModel:
    """Raises an exception during ainvoke to simulate a run error."""

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        raise RuntimeError("simulated model failure")


class ErrorOnSecondCallChatModel:
    """First call returns AIMessage with text and a tool_call. Second call raises."""

    def __init__(self) -> None:
        self._call_count = 0

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        if self._call_count == 0:
            self._call_count += 1
            return AIMessage(
                content="ドキュメントを確認します...",
                tool_calls=[
                    {
                        "id": "call_cleanup_test",
                        "name": "mock_doc_tool",
                        "args": {"doc_id": "D001"},
                        "type": "tool_call",
                    }
                ],
            )
        raise RuntimeError("error on second model call")


def test_run_error_emits_exactly_one_run_error_event() -> None:
    """RUN_ERROR は 1 回だけ送出され、最後のイベントとなる。"""
    app = lang_chain_app.create_app(graph=build_graph(ErrorChatModel()))

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "t-err",
                "messages": [{"id": "u1", "role": "user", "content": "fail"}],
            },
        )

    assert response.status_code == 200
    events = _sse_events(response.text)
    types = [e["type"] for e in events]

    assert types.count("RUN_ERROR") == 1
    assert types[-1] == "RUN_ERROR"
    assert types[0] == "RUN_STARTED"
    run_error_event = next(e for e in events if e["type"] == "RUN_ERROR")
    assert "message" in run_error_event
    assert "simulated model failure" in str(run_error_event["message"])


def test_run_error_closes_open_events_before_error() -> None:
    """テキスト送出中にエラーが起きた場合、RUN_ERROR の前に TEXT_MESSAGE_END が送出される。"""
    graph = build_graph(ErrorOnSecondCallChatModel(), server_tools=[mock_doc_tool])
    app = lang_chain_app.create_app(graph=graph)

    with TestClient(app) as client:
        response = client.post(
            "/",
            json={
                "threadId": "t-cleanup",
                "messages": [{"id": "u1", "role": "user", "content": "review doc"}],
            },
        )

    assert response.status_code == 200
    events = _sse_events(response.text)
    types = [e["type"] for e in events]

    assert types.count("RUN_ERROR") == 1
    assert types[-1] == "RUN_ERROR"
    assert "TEXT_MESSAGE_START" in types
    assert types.count("TEXT_MESSAGE_START") == types.count("TEXT_MESSAGE_END")
