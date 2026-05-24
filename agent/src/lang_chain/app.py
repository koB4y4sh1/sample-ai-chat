import asyncio
from collections.abc import Coroutine
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from ag_ui_langgraph import add_langgraph_fastapi_endpoint  # type: ignore[import-untyped]
from copilotkit import LangGraphAGUIAgent
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.tools import BaseTool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.state import CompiledStateGraph

from ..config import Settings, get_settings, parse_cors_origins
from .graph import build_graph
from .state import ChatModel
from .tool import build_tools

AGENT_NAME = "sample_agent"
AGENT_DESCRIPTION = "Zenith LangGraph agent exposed through CopilotKit AG-UI."


def _run_coroutine_sync(coroutine: Coroutine[Any, Any, list[BaseTool]]) -> list[BaseTool]:
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coroutine)

    with ThreadPoolExecutor(max_workers=1) as executor:
        return executor.submit(asyncio.run, coroutine).result()


def _resolve_server_tools(
    *,
    graph: CompiledStateGraph[Any, Any, Any, Any] | None,
    settings: Settings,
) -> list[BaseTool]:
    if graph is not None:
        return []
    return _run_coroutine_sync(build_tools(settings))


def create_app(
    *,
    graph: CompiledStateGraph[Any, Any, Any, Any] | None = None,
    chat_model: ChatModel | None = None,
    server_tools: list[BaseTool] | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    resolved_settings = settings or get_settings()
    app = FastAPI(title="Zenith LangChain LangGraph AG-UI")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_cors_origins(resolved_settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    resolved_graph = graph or build_graph(
        chat_model=chat_model,
        settings=resolved_settings,
        server_tools=server_tools
        if server_tools is not None
        else _resolve_server_tools(
            graph=graph,
            settings=resolved_settings,
        ),
        checkpointer=MemorySaver(),
    )

    add_langgraph_fastapi_endpoint(
        app=app,
        agent=LangGraphAGUIAgent(
            name=AGENT_NAME,
            description=AGENT_DESCRIPTION,
            graph=resolved_graph,
        ),
        path="/ag-ui",
    )

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok", "agent_runtime": "lang-chain"}

    return app


def main() -> None:
    import uvicorn

    uvicorn.run(create_app(), host="127.0.0.1", port=8200)
