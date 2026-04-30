from fastapi import FastAPI
from fastapi.testclient import TestClient
from src import main as agent_main


def test_main_app_mounts_mfa_and_lang_chain_apps(monkeypatch) -> None:
    def create_mfa_app() -> FastAPI:
        app = FastAPI()

        @app.get("/health")
        async def healthcheck() -> dict[str, str]:
            return {"status": "ok", "agent_runtime": "mfa"}

        return app

    def create_lang_chain_app() -> FastAPI:
        app = FastAPI()

        @app.get("/health")
        async def healthcheck() -> dict[str, str]:
            return {"status": "ok", "agent_runtime": "lang-chain"}

        return app

    monkeypatch.setattr(agent_main, "create_mfa_app", create_mfa_app)
    monkeypatch.setattr(agent_main, "create_lang_chain_app", create_lang_chain_app)

    app = agent_main.create_app()

    with TestClient(app) as client:
        health = client.get("/health")
        mfa_health = client.get("/mfa/health")
        lang_chain_health = client.get("/lang-chain/health")

    assert health.status_code == 200
    assert health.json() == {
        "status": "ok",
        "mfa": "/mfa",
        "lang_chain": "/lang-chain",
    }
    assert mfa_health.json() == {"status": "ok", "agent_runtime": "mfa"}
    assert lang_chain_health.json() == {"status": "ok", "agent_runtime": "lang-chain"}
