from fastapi.testclient import TestClient
from src import main as ag_ui_app


def test_create_app_registers_copilotkit_endpoint(monkeypatch) -> None:
    registered: dict[str, object] = {}
    sentinel_agent = object()

    monkeypatch.setattr(ag_ui_app, "build_agent", lambda settings: sentinel_agent)
    monkeypatch.setattr(
        ag_ui_app,
        "add_agent_framework_fastapi_endpoint",
        lambda app, agent, path: registered.update(
            {
                "app": app,
                "agent": agent,
                "path": path,
            }
        ),
    )

    app = ag_ui_app.create_app()

    assert registered["app"] is app
    assert registered["agent"] is sentinel_agent
    assert registered["path"] == "/copilotkit"


def test_create_app_exposes_health_endpoint(monkeypatch) -> None:
    monkeypatch.setattr(ag_ui_app, "build_agent", lambda settings: object())
    monkeypatch.setattr(
        ag_ui_app,
        "add_agent_framework_fastapi_endpoint",
        lambda app, agent, path: None,
    )

    app = ag_ui_app.create_app()

    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
