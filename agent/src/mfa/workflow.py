from dataclasses import dataclass
from typing import Literal, Never

from agent_framework import (  # type: ignore[attr-defined]
    AgentExecutor,
    AgentExecutorRequest,
    Case,
    Default,
    Executor,
    Message,
    Workflow,
    WorkflowBuilder,
    WorkflowContext,
    executor,
    handler,
)
from agent_framework.ag_ui import AgentFrameworkWorkflow

from ..config import DEFAULT_MODEL, MODEL_ALIASES, SUPPORTED_MODELS, Settings
from .agents import build_openai_agent


@dataclass(frozen=True)
class RouteDecision:
    route: Literal["chat", "empty"]
    messages: list[Message]
    last_user_text: str


class InfoCollector(Executor):  # type: ignore[misc]
    def __init__(self) -> None:
        super().__init__("collect_context")

    @handler  # type: ignore[untyped-decorator]
    async def collect(self, messages: list[Message], ctx: WorkflowContext[RouteDecision]) -> None:
        last_user_text = ""
        for message in reversed(messages):
            if message.role == "user":
                last_user_text = (message.text or "").strip()
                break

        route: Literal["chat", "empty"] = "chat" if last_user_text else "empty"
        await ctx.send_message(RouteDecision(route=route, messages=messages, last_user_text=last_user_text))


@executor(id="to_chat_request")  # type: ignore[untyped-decorator]
async def to_chat_request(decision: RouteDecision, ctx: WorkflowContext[AgentExecutorRequest]) -> None:
    await ctx.send_message(AgentExecutorRequest(messages=decision.messages, should_respond=True))


@executor(id="empty_request")  # type: ignore[untyped-decorator]
async def empty_request(decision: RouteDecision, ctx: WorkflowContext[Never, str]) -> None:
    await ctx.yield_output("Input message is empty.")


def should_run_chat(decision: RouteDecision) -> bool:
    return decision.route == "chat"


def resolve_model(model: str) -> str:
    model = MODEL_ALIASES.get(model.strip(), model.strip())
    return model if model in SUPPORTED_MODELS else DEFAULT_MODEL


def build_workflow(settings: Settings, *, model: str | None = None) -> Workflow:
    info_collector = InfoCollector()
    chat_agent = AgentExecutor(build_openai_agent(settings, model=resolve_model(model or settings.openai_model)), id="chat_agent")

    return (
        WorkflowBuilder(
            name="zenith",
            description="Zenith AI Chat workflow",
            start_executor=info_collector,
        )
        .add_switch_case_edge_group(
            info_collector,
            [
                Case(condition=should_run_chat, target=to_chat_request),
                Default(target=empty_request),
            ],
        )
        .add_edge(to_chat_request, chat_agent)
        .build()
    )


def build_ag_ui_workflow(settings: Settings) -> AgentFrameworkWorkflow:
    return AgentFrameworkWorkflow(
        workflow_factory=lambda _thread_id: build_workflow(settings),
        name="zenith",
        description="Zenith AI Chat workflow",
    )
