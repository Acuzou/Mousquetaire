from fastapi.testclient import TestClient

from app.main import (
    MAX_MEGA_DECK_WORDS,
    MAX_PLAYERS_PER_ROOM,
    ROOM_CODE_LENGTH,
    app,
    rooms_by_code,
)

ROOM_CODE_ALPHABET = set("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")


def test_health_endpoint_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_room_returns_room_id_and_code() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        response = client.post("/rooms")

    assert response.status_code == 201
    payload = response.json()
    assert payload["room_id"]
    assert len(payload["room_code"]) == ROOM_CODE_LENGTH
    assert set(payload["room_code"]).issubset(ROOM_CODE_ALPHABET)


def test_create_room_returns_readable_error_when_allocation_fails(monkeypatch) -> None:
    def always_collide() -> str:
        return "ABC123"

    rooms_by_code.clear()
    rooms_by_code["ABC123"] = object()  # type: ignore[assignment]
    monkeypatch.setattr("app.main.generate_room_code", always_collide)

    with TestClient(app) as client:
        response = client.post("/rooms")

    assert response.status_code == 500
    assert response.json() == {
        "detail": {
            "error_code": "room_creation_failed",
            "message": "Impossible de creer la salle pour le moment. Reessayez.",
        }
    }


def test_join_room_with_valid_code_and_pseudo_sets_session_cookie() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        response = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Alex"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["room_id"] == created["room_id"]
    assert payload["room_code"] == created["room_code"]
    assert payload["pseudo"] == "Alex"
    assert response.cookies.get("mousquetaire_session")
    set_cookie_header = response.headers.get("set-cookie", "")
    assert "HttpOnly" in set_cookie_header
    assert "SameSite=lax" in set_cookie_header


def test_join_room_normalizes_lowercase_room_code() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        response = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"].lower(), "pseudo": "Alex"},
        )

    assert response.status_code == 200
    assert response.json()["room_code"] == created["room_code"]


def test_join_room_rejects_invalid_code_with_explicit_message() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        response = client.post(
            "/rooms/join",
            json={"room_code": "ZZZZZZ", "pseudo": "Alex"},
        )

    assert response.status_code == 404
    assert response.json() == {
        "detail": {
            "error_code": "room_not_found",
            "message": "Code de salle invalide ou salle indisponible.",
        }
    }


def test_join_room_rejects_when_room_is_full() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        for index in range(MAX_PLAYERS_PER_ROOM):
            joined = client.post(
                "/rooms/join",
                json={"room_code": created["room_code"], "pseudo": f"Joueur{index}"},
            )
            assert joined.status_code == 200

        response = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Extra"},
        )

    assert response.status_code == 409
    assert response.json() == {
        "detail": {
            "error_code": "room_full",
            "message": f"Salle complete ({MAX_PLAYERS_PER_ROOM} joueurs max).",
        }
    }


def test_add_mega_deck_word_returns_updated_list() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        added = client.post(
            f"/rooms/{created['room_code']}/mega-deck",
            json={"word": "Ananas"},
        )

    assert added.status_code == 200
    payload = added.json()
    assert payload["room_code"] == created["room_code"]
    assert payload["words"] == ["Ananas"]
    assert payload["max_words"] == MAX_MEGA_DECK_WORDS


def test_add_mega_deck_word_rejects_duplicate() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        first = client.post(
            f"/rooms/{created['room_code']}/mega-deck",
            json={"word": "Ananas"},
        )
        assert first.status_code == 200
        duplicate = client.post(
            f"/rooms/{created['room_code']}/mega-deck",
            json={"word": "ananas"},
        )

    assert duplicate.status_code == 409
    assert duplicate.json() == {
        "detail": {
            "error_code": "word_duplicate",
            "message": "Ce mot est deja present dans le mega-deck.",
        }
    }


def test_add_mega_deck_word_rejects_when_limit_reached() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        for index in range(MAX_MEGA_DECK_WORDS):
            added = client.post(
                f"/rooms/{created['room_code']}/mega-deck",
                json={"word": f"Mot{index}"},
            )
            assert added.status_code == 200

        response = client.post(
            f"/rooms/{created['room_code']}/mega-deck",
            json={"word": "Overflow"},
        )

    assert response.status_code == 409
    assert response.json() == {
        "detail": {
            "error_code": "mega_deck_limit_reached",
            "message": f"Limite atteinte ({MAX_MEGA_DECK_WORDS} mots max).",
        }
    }


def test_get_mega_deck_returns_current_words() -> None:
    rooms_by_code.clear()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        added = client.post(
            f"/rooms/{created['room_code']}/mega-deck",
            json={"word": "Ananas"},
        )
        assert added.status_code == 200
        deck = client.get(f"/rooms/{created['room_code']}/mega-deck")

    assert deck.status_code == 200
    payload = deck.json()
    assert payload["room_code"] == created["room_code"]
    assert payload["words"] == ["Ananas"]
