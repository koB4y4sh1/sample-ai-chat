from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.tools import BaseTool
from langgraph.graph.state import CompiledStateGraph

from ..config import Settings, get_settings, parse_cors_origins
from .event import stream_ag_ui_events
from .graph import build_graph
from .mcp_tools import build_mcp_client
from .model import build_foundry_chat_model
from .schemas import RunAgentRequest
from .state import ChatModel


async def load_server_tools(settings: Settings) -> list[BaseTool]:
    mcp_client = build_mcp_client(settings)
    if mcp_client is None:
        return []

    return await mcp_client.get_tools()


async def ensure_server_tools(
    app: FastAPI,
    settings: Settings,
    configured_server_tools: list[BaseTool] | None,
) -> list[BaseTool]:
    existing_tools = getattr(app.state, "server_tools", None)
    if isinstance(existing_tools, list):
        return existing_tools

    if configured_server_tools is not None:
        app.state.server_tools = configured_server_tools
        return configured_server_tools

    loaded_tools = await load_server_tools(settings)
    app.state.server_tools = loaded_tools
    return loaded_tools


def create_app(
    *,
    graph: CompiledStateGraph[Any, Any, Any, Any] | None = None,
    chat_model: ChatModel | None = None,
    settings: Settings | None = None,
    server_tools: list[BaseTool] | None = None,
) -> FastAPI:
    resolved_settings = settings or get_settings()
    configured_server_tools = list(server_tools) if server_tools is not None else None
    cached_model: ChatModel | None = chat_model

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        try:
            await ensure_server_tools(app, resolved_settings, configured_server_tools)
        except Exception as exc:
            app.state.server_tools_load_error = str(exc)
        yield

    async def get_graph(app: FastAPI, tools: list[dict[str, Any]]) -> CompiledStateGraph[Any, Any, Any, Any]:
        nonlocal cached_model

        if graph is not None:
            return graph

        if cached_model is None:
            cached_model = build_foundry_chat_model(resolved_settings)

        resolved_server_tools = await ensure_server_tools(app, resolved_settings, configured_server_tools)
        return build_graph(
            cached_model,
            tools=tools if tools else None,
            server_tools=resolved_server_tools,
        )

    app = FastAPI(title="Zenith LangChain LangGraph AG-UI", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_cors_origins(resolved_settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok", "agent_runtime": "lang-chain"}

    @app.post("/")
    async def run_agent(request: RunAgentRequest, http_request: Request) -> StreamingResponse:
        run_graph = await get_graph(http_request.app, request.tools)
        return StreamingResponse(
            stream_ag_ui_events(graph=run_graph, request=request),
            media_type="text/event-stream",
        )

    return app


def main() -> None:
    import uvicorn

    uvicorn.run(create_app(), host="127.0.0.1", port=8200)
