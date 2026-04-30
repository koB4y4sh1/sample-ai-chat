from typing import Any, Literal

from pydantic import BaseModel, Field


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
    status: Literal["success", "error"] = "success"
    tool_calls: list[AGUIToolCall] | None = Field(default=None, alias="toolCalls")
    tool_call_id: str | None = Field(default=None, alias="toolCallId")


class RunAgentRequest(BaseModel):
    thread_id: str = Field(alias="threadId")
    run_id: str | None = Field(default=None, alias="runId")
    state: dict[str, Any] = Field(default_factory=dict)
    messages: list[AGUIMessage] = Field(default_factory=list)
    tools: list[dict[str, Any]] = Field(default_factory=list)
    context: list[dict[str, Any]] = Field(default_factory=list)
