import json
from collections.abc import Sequence
from typing import Any

from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from src.lang_chain import app as lang_chain_app
from src.lang_chain.graph import build_zenith_graph, last_user_text


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


class CapturingChatModel:
    """Records every message passed to ainvoke."""

    def __init__(self) -> None:
        self.received: list[BaseMessage] = []

    async def ainvoke(self, input: Sequence[BaseMessage], **kwargs: Any) -> BaseMessage:
        self.received.extend(input)
        return AIMessage(content="done")


def _sse_events(text: str) -> list[dict[str, object]]:
    return [json.loads(line.removeprefix("data: ")) for line in text.splitlines() if line.startswith("data: ")]


def test_create_lang_chain_app_exposes_health_endpoint() -> None:
    app = lang_chain_app.create_app()

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "agent_runtime": "lang-chain"}


async def test_lang_graph_returns_assistant_message() -> None:
    graph = build_zenith_graph(EchoChatModel())

    result = await graph.ainvoke({"messages": [HumanMessage(content="hello")]})

    assert isinstance(result["messages"][-1], AIMessage)
    assert "hello" in str(result["messages"][-1].content)


def test_lang_chain_agent_streams_ag_ui_events() -> None:
    app = lang_chain_app.create_app(graph=build_zenith_graph(EchoChatModel()))

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
    app = lang_chain_app.create_app(graph=build_zenith_graph(EchoChatModel()))

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
