from agent_framework.ag_ui import add_agent_framework_fastapi_endpoint
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config import get_settings, parse_cors_origins
from .agents import build_anthropic_agent, build_openai_agent


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Zenith Microsoft Agent Framework")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_cors_origins(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    add_agent_framework_fastapi_endpoint(app=app, agent=build_openai_agent(settings), path="/openai")
    add_agent_framework_fastapi_endpoint(
        app=app,
        agent=build_anthropic_agent(settings),
        path="/anthropic",
    )

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok", "agent_runtime": "mfa"}

    return app
