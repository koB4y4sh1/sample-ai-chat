import json
from collections.abc import AsyncIterator
from typing import Any
from uuid import uuid4

from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, BaseMessageChunk, ToolMessage
from langgraph.graph.state import CompiledStateGraph

from .graph import to_lang_chain_message
from .schemas import AGUIMessage, RunAgentRequest


def _text_from_content(content: str | list[dict[str, Any]] | None) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    return "\n".join(str(part["text"]) for part in content if part.get("type") == "text" and isinstance(part.get("text"), str))


def _to_lang_chain_messages(messages: list[AGUIMessage]) -> list[BaseMessage]:
    result: list[BaseMessage] = []
    tool_result_ids = {message.tool_call_id for message in messages if message.role == "tool" and message.tool_call_id}
    for message in messages:
        if message.role == "tool":
            if message.tool_call_id:
                result.append(
                    ToolMessage(
                        content=_text_from_content(message.content),
                        tool_call_id=message.tool_call_id,
                        status=message.status,
                    )
                )
        elif message.role == "assistant" and message.tool_calls:
            matched_tool_calls = [tc for tc in message.tool_calls if tc.id in tool_result_ids]
            if not matched_tool_calls:
                content = _text_from_content(message.content)
                if content:
                    result.append(AIMessage(content=content))
                continue

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
                        for tc in matched_tool_calls
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


def _tool_call_arguments(args: Any) -> str:
    if isinstance(args, str):
        return args
    return json.dumps(args or {}, separators=(",", ":"))


def _message_id(message: BaseMessage, fallback: str | None = None) -> str:
    if isinstance(message.id, str) and message.id:
        return message.id
    return fallback or str(uuid4())


def _to_ag_ui_message(message: BaseMessage, *, fallback_id: str | None = None) -> dict[str, Any] | None:
    if isinstance(message, ToolMessage):
        return {
            "id": _message_id(message, fallback_id),
            "role": "tool",
            "content": _message_content_text(message),
            "toolCallId": message.tool_call_id,
            "status": message.status,
        }

    if isinstance(message, AIMessage):
        agui_message: dict[str, Any] = {
            "id": _message_id(message, fallback_id),
            "role": "assistant",
        }
        content = _message_content_text(message)
        if content:
            agui_message["content"] = content
        if message.tool_calls:
            agui_message["toolCalls"] = [
                {
                    "id": tc.get("id") or str(uuid4()),
                    "type": "function",
                    "function": {
                        "name": tc.get("name") or "",
                        "arguments": _tool_call_arguments(tc.get("args")),
                    },
                }
                for tc in message.tool_calls
            ]
        return agui_message

    return None


def _tool_call_history_message(
    *,
    message_id: str,
    tool_call_order: list[int],
    tool_call_state: dict[int, dict[str, Any]],
) -> dict[str, Any] | None:
    if not tool_call_order:
        return None

    return {
        "id": message_id,
        "role": "assistant",
        "toolCalls": [
            {
                "id": tool_call_state[idx]["id"],
                "type": "function",
                "function": {
                    "name": tool_call_state[idx]["name"],
                    "arguments": "".join(tool_call_state[idx]["args_parts"]),
                },
            }
            for idx in tool_call_order
        ],
    }


async def stream_ag_ui_events(
    *,
    graph: CompiledStateGraph[Any, Any, Any, Any],
    request: RunAgentRequest,
) -> AsyncIterator[str]:
    run_id = request.run_id or str(uuid4())
    message_id = str(uuid4())
    tool_call_message_id = f"{message_id}-tool-call"
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
        tool_logs: list[str] = []
        output_messages: list[BaseMessage] = []
        tool_results: list[dict[str, str]] = []
        tool_call_state: dict[int, dict[str, Any]] = {}
        tool_call_order: list[int] = []
        closed_tool_call_ids: set[str] = set()
        tool_call_message_started = False
        tool_call_message_ended = False

        async for mode, data in graph.astream(
            {"messages": _to_lang_chain_messages(request.messages), "tool_logs": []},
            stream_mode=["messages", "updates"],
        ):
            if mode == "updates":
                updates: dict[str, Any] = data  # type: ignore[assignment]
                for node_state in updates.values():
                    if isinstance(node_state, dict) and isinstance(node_state.get("tool_logs"), list):
                        tool_logs = node_state["tool_logs"]
                    if not isinstance(node_state, dict) or not isinstance(node_state.get("messages"), list):
                        continue
                    for output_message in node_state["messages"]:
                        if not isinstance(output_message, BaseMessage):
                            continue
                        output_messages.append(output_message)
                        if not isinstance(output_message, ToolMessage):
                            continue

                        tool_result = {
                            "messageId": _message_id(output_message),
                            "toolCallId": output_message.tool_call_id,
                            "content": _message_content_text(output_message),
                            "status": output_message.status,
                        }
                        tool_results.append(tool_result)
                        for tool_idx in tool_call_order:
                            tool_call_id = str(tool_call_state[tool_idx]["id"])
                            if tool_call_id in closed_tool_call_ids:
                                continue
                            yield _sse_event({"type": "TOOL_CALL_END", "toolCallId": tool_call_id})
                            closed_tool_call_ids.add(tool_call_id)
                        if tool_call_message_started and not tool_call_message_ended:
                            yield _sse_event({"type": "TEXT_MESSAGE_END", "messageId": tool_call_message_id})
                            tool_call_message_ended = True
                        yield _sse_event(
                            {
                                "type": "TOOL_CALL_RESULT",
                                "role": "tool",
                                **tool_result,
                            }
                        )
                continue

            msg_event: tuple[Any, Any] = data  # type: ignore[assignment]
            message, _metadata = msg_event
            if not isinstance(message, AIMessage | AIMessageChunk):
                continue

            delta = _message_content_text(message)
            if delta:
                if not text_started:
                    yield _sse_event({"type": "TEXT_MESSAGE_START", "messageId": message_id, "role": "assistant"})
                    text_started = True
                content_parts.append(delta)
                yield _sse_event({"type": "TEXT_MESSAGE_CONTENT", "messageId": message_id, "delta": delta})

            if isinstance(message, AIMessageChunk) and message.tool_call_chunks:
                for tc_chunk in message.tool_call_chunks:
                    idx: int = tc_chunk.get("index") or 0
                    if idx not in tool_call_state:
                        tc_id = tc_chunk.get("id") or str(uuid4())
                        tc_name = tc_chunk.get("name") or ""
                        tool_call_state[idx] = {"id": tc_id, "name": tc_name, "args_parts": []}
                        tool_call_order.append(idx)
                        if not tool_call_message_started:
                            yield _sse_event({"type": "TEXT_MESSAGE_START", "messageId": tool_call_message_id, "role": "assistant"})
                            tool_call_message_started = True
                        yield _sse_event(
                            {
                                "type": "TOOL_CALL_START",
                                "toolCallId": tc_id,
                                "toolCallName": tc_name,
                                "parentMessageId": tool_call_message_id,
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

            elif not isinstance(message, AIMessageChunk) and isinstance(message, AIMessage) and message.tool_calls:
                for i, tc in enumerate(message.tool_calls):
                    if i not in tool_call_state:
                        tc_id = tc.get("id") or str(uuid4())
                        tc_name = tc.get("name") or ""
                        args_str = json.dumps(tc.get("args") or {}, separators=(",", ":"))
                        tool_call_state[i] = {"id": tc_id, "name": tc_name, "args_parts": [args_str]}
                        tool_call_order.append(i)
                        if not tool_call_message_started:
                            yield _sse_event({"type": "TEXT_MESSAGE_START", "messageId": tool_call_message_id, "role": "assistant"})
                            tool_call_message_started = True
                        yield _sse_event(
                            {
                                "type": "TOOL_CALL_START",
                                "toolCallId": tc_id,
                                "toolCallName": tc_name,
                                "parentMessageId": tool_call_message_id,
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
            tool_call_id = str(tool_call_state[idx]["id"])
            if tool_call_id in closed_tool_call_ids:
                continue
            yield _sse_event({"type": "TOOL_CALL_END", "toolCallId": tool_call_id})
            closed_tool_call_ids.add(tool_call_id)
        if tool_call_message_started and not tool_call_message_ended:
            yield _sse_event({"type": "TEXT_MESSAGE_END", "messageId": tool_call_message_id})
            tool_call_message_ended = True

        content = "".join(content_parts)
        generated_messages: list[dict[str, Any]] = []
        tool_call_message = _tool_call_history_message(
            message_id=tool_call_message_id,
            tool_call_order=tool_call_order,
            tool_call_state=tool_call_state,
        )
        if tool_call_message is not None:
            generated_messages.append(tool_call_message)
        generated_messages.extend(
            {
                "id": tool_result["messageId"],
                "role": "tool",
                "content": tool_result["content"],
                "toolCallId": tool_result["toolCallId"],
            }
            for tool_result in tool_results
        )
        if content:
            generated_messages.append({"id": message_id, "role": "assistant", "content": content})
        if not generated_messages:
            for index, output_message in enumerate(output_messages):
                fallback_id = message_id if index == len(output_messages) - 1 else f"{message_id}-{index}"
                agui_message = _to_ag_ui_message(output_message, fallback_id=fallback_id)
                if agui_message is not None:
                    generated_messages.append(agui_message)

        history_messages = [
            *[m.model_dump(by_alias=True, exclude_none=True) for m in request.messages],
            *generated_messages,
        ]

        yield _sse_event(
            {
                "type": "STATE_SNAPSHOT",
                "snapshot": {
                    **request.state,
                    "tool_logs": tool_logs,
                    "tool_results": tool_results,
                    "messages": history_messages,
                },
            }
        )
        if tool_call_order or tool_results:
            yield _sse_event({"type": "MESSAGES_SNAPSHOT", "messages": history_messages})
        yield _sse_event(
            {
                "type": "RUN_FINISHED",
                "threadId": request.thread_id,
                "runId": run_id,
                "result": content,
            }
        )
    except Exception as exc:
        # オープン中のメッセージ/ツールイベントを RUN_ERROR の前に必ず閉じる
        if text_started:
            yield _sse_event({"type": "TEXT_MESSAGE_END", "messageId": message_id})
        for idx in tool_call_order:
            tc_id = str(tool_call_state[idx]["id"])
            if tc_id not in closed_tool_call_ids:
                yield _sse_event({"type": "TOOL_CALL_END", "toolCallId": tc_id})
                closed_tool_call_ids.add(tc_id)
        if tool_call_message_started and not tool_call_message_ended:
            yield _sse_event({"type": "TEXT_MESSAGE_END", "messageId": tool_call_message_id})
        yield _sse_event({"type": "RUN_ERROR", "message": str(exc)})
