import json
from collections.abc import AsyncIterator
from typing import Any, Literal
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, BaseMessageChunk, ToolMessage
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel, Field

from ..config import get_settings, parse_cors_origins
from .graph import ChatModel, build_foundry_chat_model, build_zenith_graph, to_lang_chain_message


class AGUIToolCallFunction(BaseModel):
    name: str
    arguments: str


class AGUIToolCall(BaseModel):
    id: str
    type: Literal["function"] = "function"
    function: AGUIToolCallFunction


class AGUIMessage(BaseModel):
    id: str | None = None
    role: Literal["system", "user", "assistant", "tool"]
    content: str | list[dict[str, Any]] | None = None
    tool_calls: list[AGUIToolCall] | None = Field(default=None, alias="toolCalls")
    tool_call_id: str | None = Field(default=None, alias="toolCallId")


class RunAgentRequest(BaseModel):
    thread_id: str = Field(alias="threadId")
    run_id: str | None = Field(default=None, alias="runId")
    state: dict[str, Any] = Field(default_factory=dict)
    messages: list[AGUIMessage] = Field(default_factory=list)
    tools: list[dict[str, Any]] = Field(default_factory=list)
    context: list[dict[str, Any]] = Field(default_factory=list)


def _text_from_content(content: str | list[dict[str, Any]] | None) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    return "\n".join(str(part["text"]) for part in content if part.get("type") == "text" and isinstance(part.get("text"), str))


def _to_lang_chain_messages(messages: list[AGUIMessage]) -> list[BaseMessage]:
    result: list[BaseMessage] = []
    for message in messages:
        if message.role == "tool":
            if message.tool_call_id:
                result.append(
                    ToolMessage(
                        content=_text_from_content(message.content),
                        tool_call_id=message.tool_call_id,
                    )
                )
        elif message.role == "assistant" and message.tool_calls:
            result.append(
                AIMessage(
                    content=_text_from_content(message.content),
                    tool_calls=[
                        {
                            "id": tc.id,
                            "name": tc.function.name,
                            "args": json.loads(tc.function.arguments) if tc.function.arguments else {},
                            "type": "tool_call",
                        }
                        for tc in message.tool_calls
                    ],
                )
            )
        else:
            lc_message = to_lang_chain_message(message.role, _text_from_content(message.content))
            if lc_message is not None:
                result.append(lc_message)
    return result


def _sse_event(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event, separators=(',', ':'))}\n\n"


def _message_content_text(message: BaseMessage | BaseMessageChunk) -> str:
    content = message.content
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    text_parts: list[str] = []
    for part in content:
        if isinstance(part, str):
            text_parts.append(part)
        elif isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str):
            text_parts.append(part["text"])
    return "".join(text_parts)


async def stream_ag_ui_events(
    *,
    graph: CompiledStateGraph[Any, Any, Any, Any],
    request: RunAgentRequest,
) -> AsyncIterator[str]:
    run_id = request.run_id or str(uuid4())
    message_id = str(uuid4())
    yield _sse_event(
        {
            "type": "RUN_STARTED",
            "threadId": request.thread_id,
            "runId": run_id,
            "input": {
                "threadId": request.thread_id,
                "runId": run_id,
                "state": request.state,
                "messages": [m.model_dump(by_alias=True, exclude_none=True) for m in request.messages],
                "tools": request.tools,
                "context": request.context,
            },
        }
    )

    try:
        content_parts: list[str] = []
        text_started = False

        # index → {id, name, args_parts}
        tool_call_state: dict[int, dict[str, Any]] = {}
        tool_call_order: list[int] = []

        async for graph_event in graph.astream(
            {"messages": _to_lang_chain_messages(request.messages)},
            stream_mode="messages",
        ):
            message, _metadata = graph_event
            if not isinstance(message, AIMessage | AIMessageChunk):
                continue

            # --- text content ---
            delta = _message_content_text(message)
            if delta:
                if not text_started:
                    yield _sse_event({"type": "TEXT_MESSAGE_START", "messageId": message_id, "role": "assistant"})
                    text_started = True
                content_parts.append(delta)
                yield _sse_event({"type": "TEXT_MESSAGE_CONTENT", "messageId": message_id, "delta": delta})

            # --- tool call chunks (streaming model) ---
            if isinstance(message, AIMessageChunk) and message.tool_call_chunks:
                for tc_chunk in message.tool_call_chunks:
                    idx: int = tc_chunk.get("index") or 0
                    if idx not in tool_call_state:
                        tc_id = tc_chunk.get("id") or str(uuid4())
                        tc_name = tc_chunk.get("name") or ""
                        tool_call_state[idx] = {"id": tc_id, "name": tc_name, "args_parts": []}
                        tool_call_order.append(idx)
                        yield _sse_event(
                            {
                                "type": "TOOL_CALL_START",
                                "toolCallId": tc_id,
                                "toolCallName": tc_name,
                                "parentMessageId": message_id,
                            }
                        )
                    args_delta: str = tc_chunk.get("args") or ""
                    if args_delta:
                        tool_call_state[idx]["args_parts"].append(args_delta)
                        yield _sse_event(
                            {
                                "type": "TOOL_CALL_ARGS",
                                "toolCallId": tool_call_state[idx]["id"],
                                "delta": args_delta,
                            }
                        )

            # --- complete tool calls (non-streaming model: plain AIMessage) ---
            elif not isinstance(message, AIMessageChunk) and isinstance(message, AIMessage) and message.tool_calls:
                for i, tc in enumerate(message.tool_calls):
                    if i not in tool_call_state:
                        tc_id = tc.get("id") or str(uuid4())
                        tc_name = tc.get("name") or ""
                        args_str = json.dumps(tc.get("args") or {}, separators=(",", ":"))
                        tool_call_state[i] = {"id": tc_id, "name": tc_name, "args_parts": [args_str]}
                        tool_call_order.append(i)
                        yield _sse_event(
                            {
                                "type": "TOOL_CALL_START",
                                "toolCallId": tc_id,
                                "toolCallName": tc_name,
                                "parentMessageId": message_id,
                            }
                        )
                        yield _sse_event(
                            {
                                "type": "TOOL_CALL_ARGS",
                                "toolCallId": tc_id,
                                "delta": args_str,
                            }
                        )

        if text_started:
            yield _sse_event({"type": "TEXT_MESSAGE_END", "messageId": message_id})

        for idx in tool_call_order:
            yield _sse_event({"type": "TOOL_CALL_END", "toolCallId": tool_call_state[idx]["id"]})

        content = "".join(content_parts)

        # Build assistant message for STATE_SNAPSHOT
        assistant_message: dict[str, Any] = {"id": message_id, "role": "assistant"}
        if content:
            assistant_message["content"] = content
        if tool_call_order:
            assistant_message["toolCalls"] = [
                {
                    "id": tool_call_state[idx]["id"],
                    "type": "function",
                    "function": {
                        "name": tool_call_state[idx]["name"],
                        "arguments": "".join(tool_call_state[idx]["args_parts"]),
                    },
                }
                for idx in tool_call_order
            ]

        yield _sse_event(
            {
                "type": "STATE_SNAPSHOT",
                "snapshot": {
                    **request.state,
                    "messages": [
                        *[m.model_dump(by_alias=True, exclude_none=True) for m in request.messages],
                        assistant_message,
                    ],
                },
            }
        )
        yield _sse_event(
            {
                "type": "RUN_FINISHED",
                "threadId": request.thread_id,
                "runId": run_id,
                "result": content,
            }
        )
    except Exception as exc:
        yield _sse_event({"type": "RUN_ERROR", "message": str(exc)})


def create_app(
    graph: CompiledStateGraph[Any, Any, Any, Any] | None = None,
    *,
    chat_model: ChatModel | None = None,
) -> FastAPI:
    settings = get_settings()

    # Resolve base model (used for per-request graph building with tools)
    if chat_model is not None:
        _model: ChatModel | None = chat_model
    elif graph is None:
        _model = build_foundry_chat_model(settings)
    else:
        _model = None  # legacy: use static graph as-is

    _static_graph = graph

    def _get_graph(tools: list[dict[str, Any]]) -> CompiledStateGraph[Any, Any, Any, Any]:
        if _model is not None:
            return build_zenith_graph(_model, tools=tools if tools else None)
        return _static_graph or build_zenith_graph(settings=settings)

    app = FastAPI(title="Zenith LangChain LangGraph AG-UI")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_cors_origins(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok", "agent_runtime": "lang-chain"}

    @app.post("/")
    async def run_agent(request: RunAgentRequest) -> StreamingResponse:
        return StreamingResponse(
            stream_ag_ui_events(graph=_get_graph(request.tools), request=request),
            media_type="text/event-stream",
        )

    return app


def main() -> None:
    import uvicorn

    uvicorn.run(create_app(), host="127.0.0.1", port=8200)
