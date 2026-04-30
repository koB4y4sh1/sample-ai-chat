import pytest
from fastapi.testclient import TestClient
from src.config import Settings
from src.mfa import app as agent_app
from src.mfa import workflow as agent_workflow


def test_create_app_registers_copilotkit_endpoint(monkeypatch) -> None:
    registered: list[dict[str, object]] = []
    sentinel_openai_agent = object()
    sentinel_anthropic_agent = object()

    monkeypatch.setattr(agent_app, "build_openai_agent", lambda settings: sentinel_openai_agent)
    monkeypatch.setattr(agent_app, "build_anthropic_agent", lambda settings: sentinel_anthropic_agent)
    monkeypatch.setattr(
        agent_app,
        "add_agent_framework_fastapi_endpoint",
        lambda app, agent, path: registered.append({"app": app, "agent": agent, "path": path}),
    )

    app = agent_app.create_app()

    assert registered == [
        {"app": app, "agent": sentinel_openai_agent, "path": "/openai"},
        {"app": app, "agent": sentinel_anthropic_agent, "path": "/anthropic"},
    ]


def test_create_app_exposes_health_endpoint(monkeypatch) -> None:
    monkeypatch.setattr(agent_app, "build_openai_agent", lambda settings: object())
    monkeypatch.setattr(agent_app, "build_anthropic_agent", lambda settings: object())
    monkeypatch.setattr(
        agent_app,
        "add_agent_framework_fastapi_endpoint",
        lambda app, agent, path: None,
    )

    app = agent_app.create_app()

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "agent_runtime": "mfa"}


def test_resolve_model_accepts_supported_alias() -> None:
    assert agent_workflow.resolve_model("gpt5.4") == "gpt-5.4"


def test_resolve_model_rejects_unlisted_model() -> None:
    assert agent_workflow.resolve_model("not-a-model") == "gpt-5.4-nano"


@pytest.mark.asyncio
async def test_workflow_routes_empty_input_to_empty_request() -> None:
    workflow = agent_workflow.build_workflow(Settings(openai_model="gpt-5.4-nano"))

    events = await workflow.run([])

    assert events.get_outputs() == ["Input message is empty."]
