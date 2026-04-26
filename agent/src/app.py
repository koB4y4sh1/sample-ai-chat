import importlib.metadata
from functools import lru_cache
from pathlib import Path
from typing import Any, cast

import agent_framework
from dedent import dedent

if not getattr(agent_framework, "__version__", None):
    cast(Any, agent_framework).__version__ = importlib.metadata.version("agent-framework")

from agent_framework._agents import Agent, SupportsAgentRun
from agent_framework._clients import BaseChatClient
from agent_framework._sessions import AgentSession
from agent_framework._tools import FunctionTool, tool
from agent_framework._types import (
    AgentResponse,
    AgentResponseUpdate,
    ChatOptions,
    ChatResponse,
    ChatResponseUpdate,
    Content,
    Message,
    ResponseStream,
)
from agent_framework._workflows._events import WorkflowRunState
from agent_framework._workflows._workflow import Workflow
from agent_framework.foundry import FoundryChatClient
from azure.identity.aio import AzureCliCredential
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict

AG_UI_ROOT = Path(__file__).resolve().parents[1]
ENV_FILE_PATH = AG_UI_ROOT / ".env"


def ensure_agent_framework_exports() -> None:
    compatibility_exports = {
        "Agent": Agent,
        "AgentResponse": AgentResponse,
        "AgentResponseUpdate": AgentResponseUpdate,
        "AgentSession": AgentSession,
        "BaseChatClient": BaseChatClient,
        "ChatOptions": ChatOptions,
        "ChatResponse": ChatResponse,
        "ChatResponseUpdate": ChatResponseUpdate,
        "Content": Content,
        "FunctionTool": FunctionTool,
        "Message": Message,
        "ResponseStream": ResponseStream,
        "SupportsAgentRun": SupportsAgentRun,
        "Workflow": Workflow,
        "WorkflowRunState": WorkflowRunState,
        "tool": tool,
    }
    for name, value in compatibility_exports.items():
        if not hasattr(agent_framework, name):
            setattr(agent_framework, name, value)


load_dotenv(dotenv_path=ENV_FILE_PATH, override=False)

ensure_agent_framework_exports()


def add_agent_framework_fastapi_endpoint(*, app: FastAPI, agent: Agent, path: str) -> None:
    from agent_framework.ag_ui import add_agent_framework_fastapi_endpoint as register_endpoint

    register_endpoint(app=app, agent=agent, path=path)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="ZENITH_",
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_model: str = "gpt-5.4-nano"
    cors_origins: str = "http://127.0.0.1:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def parse_cors_origins(cors_origins: str) -> list[str]:
    return [origin.strip() for origin in cors_origins.split(",") if origin.strip()]


def build_agent(settings: Settings) -> Agent:
    return Agent(
        name="zenith",
        instructions=dedent(
            """
            You are Zenith AI. Answer clearly, briefly, and accurately.
            Use Generative UI tools when the user asks for visual, structured, dashboard-like,
            or interactive responses. Use show_zenith_panel for simple fixed status cards,
            metrics, and action plans. Use show_ui_spec for flexible declarative layouts such
            as metric grids, tables, lists, callouts, action groups, key-value summaries,
            progress bars, checklists, timelines, comparisons, risk matrices, decisions, tabs,
            accordions, quotes, status strips, flight cards, flight option cards, sales funnels,
            full sales dashboards, answer cards, source lists, task plans, confirmation panels,
            form fills, choice pickers, diff previews, error diagnosis panels, file attachment
            cards, and progress trackers. Prefer chat-business blocks for answers with
            citations, execution plans, confirmations, user input collection, choices, code or
            document diffs, troubleshooting, attachments, and step progress. For diff_preview,
            always provide before and after content; for proofreading, original and corrected
            text are acceptable aliases. Choose polished,
            varied declarative blocks that fit the user's intent instead of repeating the same
            layout. Use flight_options for travel
            search results only when using show_ui_spec; prefer the dedicated show_flight_options
            frontend tool for flight search result cards and never return raw JSON for flight
            cards. Use sales_dashboard for KPI dashboards with charts and recent orders.
            Use show_mcp_app for open-ended embedded app experiences that require an interactive
            surface. Prefer tool calls over describing the UI in plain text when a tool fits
            the request. Respect the current Zenith chat controls context when it is provided:
            treat selected model as a response profile preference, and prefer enabled tool
            families without claiming unavailable tools were executed.
            """
        ).strip(),
        client=FoundryChatClient(model=settings.openai_model, credential=AzureCliCredential()),
        default_options={"reasoning": {"effort": "medium", "summary": "detailed"}},
    )


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Zenith AG-UI")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_cors_origins(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    add_agent_framework_fastapi_endpoint(
        app=app,
        agent=build_agent(settings),
        path="/copilotkit",
    )

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app
