import pytest
from fastapi.testclient import TestClient
from src import app as agent_app


def test_create_app_registers_copilotkit_endpoint(monkeypatch) -> None:
    registered: list[dict[str, object]] = []
    sentinel_agent = object()

    monkeypatch.setattr(agent_app, "build_agent", lambda settings: sentinel_agent)
    monkeypatch.setattr(
        agent_app,
        "add_agent_framework_fastapi_endpoint",
        lambda app, agent, path: registered.append({"app": app, "agent": agent, "path": path}),
    )

    app = agent_app.create_app()

    assert registered[0] == {"app": app, "agent": sentinel_agent, "path": "/copilotkit"}
    assert registered[1]["app"] is app
    assert registered[1]["path"] == "/copilotkit/anthropic"
    assert isinstance(registered[1]["agent"], agent_app.LazyAgent)


def test_create_app_exposes_health_endpoint(monkeypatch) -> None:
    monkeypatch.setattr(agent_app, "build_agent", lambda settings: object())
    monkeypatch.setattr(
        agent_app,
        "add_agent_framework_fastapi_endpoint",
        lambda app, agent, path: None,
    )

    app = agent_app.create_app()

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_resolve_model_accepts_supported_alias() -> None:
    assert agent_app.resolve_model("gpt5.4") == "gpt-5.4"


def test_resolve_model_rejects_unlisted_model() -> None:
    assert agent_app.resolve_model("not-a-model") == "gpt-5.4-nano"


@pytest.mark.asyncio
async def test_workflow_routes_empty_input_to_empty_request() -> None:
    workflow = agent_app.build_workflow(agent_app.Settings(openai_model="gpt-5.4-nano"))

    events = await workflow.run([])

    assert events.get_outputs() == ["Input message is empty."]
