from fastapi.testclient import TestClient

from app.main import app


def test_ai_assist_status_when_not_configured(monkeypatch) -> None:
    monkeypatch.delenv("MOUSQUETAIRE_AI_API_KEY", raising=False)
    with TestClient(app) as client:
        response = client.get("/ai/assist/status")

    assert response.status_code == 200
    body = response.json()
    assert body["assist_configured"] is False
    assert body["assist_provider_label"] is None
    assert "sans blocage" in body["message_fr"].lower() or "non configure" in body["message_fr"].lower()
    raw = response.text
    assert "MOUSQUETAIRE_AI_API_KEY" not in raw


def test_ai_assist_status_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("MOUSQUETAIRE_AI_API_KEY", "secret-key-never-leaked")
    with TestClient(app) as client:
        response = client.get("/ai/assist/status")

    assert response.status_code == 200
    body = response.json()
    assert body["assist_configured"] is True
    assert body["assist_provider_label"] == "serveur"
    assert "secret-key-never-leaked" not in response.text


def test_ai_assist_ping_client_disabled_always_ok(monkeypatch) -> None:
    monkeypatch.delenv("MOUSQUETAIRE_AI_API_KEY", raising=False)
    with TestClient(app) as client:
        response = client.post("/ai/assist/ping", json={"assist_enabled_client": False})

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["assist_enabled_client"] is False
    assert body["latency_ms"] is not None


def test_ai_assist_ping_client_enabled_not_configured(monkeypatch) -> None:
    monkeypatch.delenv("MOUSQUETAIRE_AI_API_KEY", raising=False)
    with TestClient(app) as client:
        response = client.post("/ai/assist/ping", json={"assist_enabled_client": True})

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is False
    assert body["assist_configured"] is False
    assert body["latency_ms"] is None


def test_ai_assist_ping_client_enabled_configured(monkeypatch) -> None:
    monkeypatch.setenv("MOUSQUETAIRE_AI_API_KEY", "sk-test")
    with TestClient(app) as client:
        response = client.post("/ai/assist/ping", json={"assist_enabled_client": True})

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["assist_configured"] is True
    assert body["latency_ms"] is not None
    assert "sk-test" not in response.text


def test_ai_assist_status_skips_support_http_log(caplog, monkeypatch) -> None:
    """GET /ai/assist/status est exclu du journal support comme les sondes frequentes."""
    import logging

    monkeypatch.delenv("MOUSQUETAIRE_AI_API_KEY", raising=False)
    caplog.set_level(logging.INFO, logger="mousquetaire.support")
    with TestClient(app) as client:
        client.get("/ai/assist/status")

    http_logs = [
        r
        for r in caplog.records
        if r.name == "mousquetaire.support" and "http_request" in r.getMessage()
    ]
    assert http_logs == []
