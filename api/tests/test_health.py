from uuid import UUID

from fastapi.testclient import TestClient

from app.main import (
    MAX_MEGA_DECK_WORDS,
    MAX_PLAYERS_PER_ROOM,
    ROOM_CODE_LENGTH,
    app,
    room_participant_live_ws,
    room_websocket_connections,
    rooms_by_code,
    session_by_token,
    session_token_by_participant,
)


def reset_storage() -> None:
    rooms_by_code.clear()
    room_websocket_connections.clear()
    room_participant_live_ws.clear()
    session_by_token.clear()
    session_token_by_participant.clear()

ROOM_CODE_ALPHABET = set("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")


def test_health_endpoint_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_room_returns_room_id_and_code() -> None:
    reset_storage()
    with TestClient(app) as client:
        response = client.post("/rooms")

    assert response.status_code == 201
    payload = response.json()
    assert payload["room_id"]
    assert len(payload["room_code"]) == ROOM_CODE_LENGTH
    assert set(payload["room_code"]).issubset(ROOM_CODE_ALPHABET)
    UUID(payload["diagnostic_ref"])


def test_join_room_returns_diagnostic_ref_uuid() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        joined = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Alex"},
        )

    assert joined.status_code == 200
    UUID(joined.json()["diagnostic_ref"])


def test_http_echoes_client_correlation_id_header() -> None:
    reset_storage()
    with TestClient(app) as client:
        response = client.post(
            "/rooms",
            headers={"X-Correlation-ID": "support-cli-correlation-01"},
        )

    assert response.status_code == 201
    assert response.headers.get("x-correlation-id") == "support-cli-correlation-01"


def test_correlation_id_overlong_header_is_replaced() -> None:
    reset_storage()
    long_id = "z" * 200
    with TestClient(app) as client:
        response = client.post("/rooms", headers={"X-Correlation-ID": long_id})

    assert response.status_code == 201
    echoed = response.headers.get("x-correlation-id")
    assert echoed != long_id
    assert len(echoed) == 36


def test_create_room_returns_readable_error_when_allocation_fails(monkeypatch) -> None:
    def always_collide() -> str:
        return "ABC123"

    reset_storage()
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
    reset_storage()
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
    assert payload["is_host"] is True
    assert payload["session_resumed"] is False
    assert response.cookies.get("mousquetaire_session")
    set_cookie_header = response.headers.get("set-cookie", "")
    assert "HttpOnly" in set_cookie_header
    assert "SameSite=lax" in set_cookie_header


def test_join_resume_with_same_cookie_keeps_participant_and_turn_version() -> None:
    reset_storage()
    host_client = TestClient(app)
    guest_client = TestClient(app)
    created = host_client.post("/rooms").json()
    code = created["room_code"]
    first = host_client.post("/rooms/join", json={"room_code": code, "pseudo": "Alex"})
    assert first.status_code == 200
    pid = first.json()["participant_id"]
    assert first.json()["session_resumed"] is False

    guest_client.post("/rooms/join", json={"room_code": code, "pseudo": "Bob"})
    tv_before = host_client.get(f"/rooms/{code}/state").json()["turn_version"]

    resume = host_client.post("/rooms/join", json={"room_code": code, "pseudo": "Alex"})
    assert resume.status_code == 200
    assert resume.json()["participant_id"] == pid
    assert resume.json()["session_resumed"] is True

    tv_after = host_client.get(f"/rooms/{code}/state").json()["turn_version"]
    assert tv_after == tv_before


def test_leave_clears_session_next_join_same_pseudo_is_new_participant() -> None:
    reset_storage()
    client = TestClient(app)
    created = client.post("/rooms").json()
    code = created["room_code"]
    join1 = client.post("/rooms/join", json={"room_code": code, "pseudo": "Alex"})
    pid1 = join1.json()["participant_id"]
    client.post("/rooms/join", json={"room_code": code, "pseudo": "Bob"})

    leave = client.post(f"/rooms/{code}/leave", json={"participant_id": pid1})
    assert leave.status_code == 200

    join2 = client.post("/rooms/join", json={"room_code": code, "pseudo": "Alex"})
    assert join2.status_code == 200
    assert join2.json()["participant_id"] != pid1
    assert join2.json()["session_resumed"] is False


def test_join_room_normalizes_lowercase_room_code() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        response = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"].lower(), "pseudo": "Alex"},
        )

    assert response.status_code == 200
    assert response.json()["room_code"] == created["room_code"]


def test_join_room_rejects_invalid_code_with_explicit_message() -> None:
    reset_storage()
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
    reset_storage()
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
    reset_storage()
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
    reset_storage()
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
    reset_storage()
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
    reset_storage()
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


def test_get_room_state_returns_blocking_reasons_before_start() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        )
        assert host.status_code == 200
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert state.status_code == 200
    payload = state.json()
    assert payload["phase"] == "pre_game"
    assert payload["variant_key"] == "mousquetaire_p0"
    assert payload["teams_count"] == 2
    assert payload["grid_size"] == 5
    assert payload["black_words"] == 1
    assert payload["participant_roles"] == {}
    assert payload["can_start"] is False
    assert payload["blocked_reasons"]


def test_start_game_rejects_non_host_with_explicit_message() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            added = client.post(
                f"/rooms/{created['room_code']}/mega-deck",
                json={"word": f"Mot{index}"},
            )
            assert added.status_code == 200
        assert host["is_host"] is True
        response = client.post(
            f"/rooms/{created['room_code']}/start",
            json={"participant_id": guest["participant_id"]},
        )

    assert response.status_code == 403
    assert response.json() == {
        "detail": {
            "error_code": "only_host_can_start",
            "message": "Seul l'hote peut demarrer la partie.",
        }
    }


def test_start_game_switches_room_to_in_game_when_conditions_met() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            added = client.post(
                f"/rooms/{created['room_code']}/mega-deck",
                json={"word": f"Mot{index}"},
            )
            assert added.status_code == 200
        started = client.post(
            f"/rooms/{created['room_code']}/start",
            json={"participant_id": host["participant_id"]},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert started.status_code == 200
    assert started.json()["phase"] == "in_game"
    assert started.json()["variant_key"] == "mousquetaire_p0"
    assert started.json()["teams_count"] == 2
    assert started.json()["grid_size"] == 5
    assert started.json()["black_words"] == 1
    assert started.json()["participant_roles"]
    assert state.status_code == 200
    assert state.json()["phase"] == "in_game"
    assert state.json()["participant_roles"]


def test_join_mid_game_returns_spectator_status() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        assert (
            client.post(
                "/rooms/join",
                json={"room_code": created["room_code"], "pseudo": "Guest"},
            ).status_code
            == 200
        )
        for index in range(MAX_MEGA_DECK_WORDS):
            added = client.post(
                f"/rooms/{created['room_code']}/mega-deck",
                json={"word": f"Mot{index}"},
            )
            assert added.status_code == 200
        started = client.post(
            f"/rooms/{created['room_code']}/start",
            json={"participant_id": host["participant_id"]},
        )
        assert started.status_code == 200
        late_join = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Late"},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert late_join.status_code == 200
    body = late_join.json()
    assert body["player_status"] == "spectator"
    assert body["room_phase"] == "in_game"
    assert body["participant_id"] not in state.json()["participant_roles"]


def test_spectator_cannot_toggle_card() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": guest["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        spec = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Watch"},
        ).json()
        denied = client.post(
            f"/rooms/{created['room_code']}/cards/toggle",
            json={
                "participant_id": spec["participant_id"],
                "card_word": "Mot0",
                "client_version": 4,
            },
        )

    assert denied.status_code == 403
    assert denied.json()["detail"]["error_code"] == "spectator_action_forbidden"


def test_add_mega_deck_word_rejects_when_game_already_started() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        )
        for index in range(MAX_MEGA_DECK_WORDS):
            added = client.post(
                f"/rooms/{created['room_code']}/mega-deck",
                json={"word": f"Mot{index}"},
            )
            assert added.status_code == 200
        started = client.post(
            f"/rooms/{created['room_code']}/start",
            json={"participant_id": host["participant_id"]},
        )
        assert started.status_code == 200
        blocked = client.post(
            f"/rooms/{created['room_code']}/mega-deck",
            json={"word": "Interdit"},
        )

    assert blocked.status_code == 409
    assert blocked.json() == {
        "detail": {
            "error_code": "mega_deck_locked",
            "message": "Le mega-deck est verrouille apres demarrage.",
        }
    }


def test_advance_turn_updates_active_player_and_version() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        started = client.post(
            f"/rooms/{created['room_code']}/start",
            json={"participant_id": p1["participant_id"]},
        )
        assert started.status_code == 200
        advanced = client.post(
            f"/rooms/{created['room_code']}/turn/next",
            json={"participant_id": p1["participant_id"], "client_version": 1},
        )

    assert advanced.status_code == 200
    payload = advanced.json()
    assert payload["turn_version"] == 2
    assert payload["active_participant_id"] == p2["participant_id"]


def test_advance_turn_rejects_outdated_version_with_resync_message() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p1["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        conflict = client.post(
            f"/rooms/{created['room_code']}/turn/next",
            json={"participant_id": p1["participant_id"], "client_version": 1},
        )

    assert conflict.status_code == 409
    assert conflict.json()["detail"]["error_code"] == "turn_version_conflict"
    assert "Resynchronisez votre etat" in conflict.json()["detail"]["message"]


def test_advance_turn_rejects_when_not_active_participant() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        forbidden = client.post(
            f"/rooms/{created['room_code']}/turn/next",
            json={"participant_id": p2["participant_id"], "client_version": 1},
        )

    assert forbidden.status_code == 403
    assert forbidden.json()["detail"]["error_code"] == "not_your_turn"


def test_websocket_receives_turn_snapshot_and_turn_change_event() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        with client.websocket_connect(f"/rooms/{created['room_code']}/events") as ws1:
            with client.websocket_connect(f"/rooms/{created['room_code']}/events") as ws2:
                snapshot1 = ws1.receive_json()
                snapshot2 = ws2.receive_json()
                assert snapshot1["type"] == "turn_snapshot"
                assert snapshot2["type"] == "turn_snapshot"
                assert (
                    client.post(
                        f"/rooms/{created['room_code']}/start",
                        json={"participant_id": p1["participant_id"]},
                    ).status_code
                    == 200
                )
                started_event_1 = ws1.receive_json()
                started_event_2 = ws2.receive_json()
                assert started_event_1["version"] == 1
                assert started_event_2["version"] == 1
                assert (
                    client.post(
                        f"/rooms/{created['room_code']}/turn/next",
                        json={"participant_id": p1["participant_id"], "client_version": 1},
                    ).status_code
                    == 200
                )
                changed_event_1 = ws1.receive_json()
                changed_event_2 = ws2.receive_json()
                assert changed_event_1["version"] == 2
                assert changed_event_2["version"] == 2
                assert changed_event_1["payload"]["active_participant_id"] == p2["participant_id"]


def test_host_ws_disconnect_starts_grace_then_transfers_host(monkeypatch) -> None:
    # Delai zero : transfert synchrone dans le handler WS (tests sans timer asyncio).
    monkeypatch.setattr("app.main.HOST_WS_ABSENCE_GRACE_MS", 0)
    reset_storage()
    host_client = TestClient(app)
    guest_client = TestClient(app)
    created = host_client.post("/rooms").json()
    code = created["room_code"]
    host = host_client.post("/rooms/join", json={"room_code": code, "pseudo": "Alex"}).json()
    guest = guest_client.post("/rooms/join", json={"room_code": code, "pseudo": "Bob"}).json()

    guest_url = f"/rooms/{code}/events?participant_id={guest['participant_id']}"
    host_url = f"/rooms/{code}/events?participant_id={host['participant_id']}"

    with guest_client.websocket_connect(guest_url) as ws_guest:
        ws_guest.receive_json()
        with host_client.websocket_connect(host_url) as ws_host:
            ws_host.receive_json()
        started = ws_guest.receive_json()
        assert started["type"] == "host_absence_grace_started"
        assert started["payload"]["host_absence_grace_until_ms"] is not None
        transferred = ws_guest.receive_json()
        assert transferred["type"] == "host_transferred_passive"

        body = guest_client.get(f"/rooms/{code}/state").json()
        assert body["host_participant_id"] == guest["participant_id"]
        assert body["host_absence_grace_until_ms"] is None


def test_host_ws_reconnect_clears_grace(monkeypatch) -> None:
    # Delai tres long : le test verifie uniquement la levee de grace au reconnect WS.
    monkeypatch.setattr("app.main.HOST_WS_ABSENCE_GRACE_MS", 9_000_000)
    reset_storage()
    host_client = TestClient(app)
    guest_client = TestClient(app)
    created = host_client.post("/rooms").json()
    code = created["room_code"]
    host = host_client.post("/rooms/join", json={"room_code": code, "pseudo": "Alex"}).json()
    guest = guest_client.post("/rooms/join", json={"room_code": code, "pseudo": "Bob"}).json()
    guest_url = f"/rooms/{code}/events?participant_id={guest['participant_id']}"
    host_url = f"/rooms/{code}/events?participant_id={host['participant_id']}"

    with guest_client.websocket_connect(guest_url) as ws_guest:
        ws_guest.receive_json()
        with host_client.websocket_connect(host_url) as ws_host:
            ws_host.receive_json()
        assert ws_guest.receive_json()["type"] == "host_absence_grace_started"
        with host_client.websocket_connect(host_url) as ws_host2:
            ws_host2.receive_json()
            cleared = ws_guest.receive_json()
            assert cleared["type"] == "host_absence_grace_cleared"

            st = guest_client.get(f"/rooms/{code}/state").json()
            assert st["host_participant_id"] == host["participant_id"]
            assert st["host_absence_grace_until_ms"] is None


def test_submit_clue_accepts_active_clue_giver_and_persists_current_clue() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        )
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        clue_response = client.post(
            f"/rooms/{created['room_code']}/clue",
            json={"participant_id": p1["participant_id"], "clue_text": "Voyage"},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert clue_response.status_code == 200
    assert clue_response.json()["clue_text"] == "Voyage"
    assert state.status_code == 200
    assert state.json()["current_clue"] == "Voyage"


def test_submit_clue_rejects_invalid_characters_with_explicit_message() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        )
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        invalid = client.post(
            f"/rooms/{created['room_code']}/clue",
            json={"participant_id": p1["participant_id"], "clue_text": "test123"},
        )

    assert invalid.status_code == 400
    assert invalid.json()["detail"]["error_code"] == "clue_invalid_characters"


def test_submit_clue_rejects_when_not_active_clue_giver() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        forbidden = client.post(
            f"/rooms/{created['room_code']}/clue",
            json={"participant_id": p2["participant_id"], "clue_text": "Voyage"},
        )

    assert forbidden.status_code == 403
    assert forbidden.json()["detail"]["error_code"] == "not_your_turn"


def test_submit_clue_rejects_second_submission_same_turn() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        )
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": p1["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        second = client.post(
            f"/rooms/{created['room_code']}/clue",
            json={"participant_id": p1["participant_id"], "clue_text": "Montagne"},
        )

    assert second.status_code == 409
    assert second.json()["detail"]["error_code"] == "clue_already_submitted"


def test_toggle_card_selection_updates_selected_cards() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p1["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        selected = client.post(
            f"/rooms/{created['room_code']}/cards/toggle",
            json={
                "participant_id": p2["participant_id"],
                "card_word": "Mot0",
                "client_version": 2,
            },
        )

    assert selected.status_code == 200
    assert selected.json()["selected_card_words"] == ["Mot0"]
    assert selected.json()["turn_version"] == 3


def test_toggle_card_selection_rejects_for_non_guesser_role() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        )
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        denied = client.post(
            f"/rooms/{created['room_code']}/cards/toggle",
            json={
                "participant_id": p1["participant_id"],
                "card_word": "Mot0",
                "client_version": 1,
            },
        )

    assert denied.status_code == 403
    assert denied.json()["detail"]["error_code"] == "role_not_allowed_to_select_card"


def test_reveal_selected_cards_reveals_and_clears_selection() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p1["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": p2["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 403
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p2["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": p1["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p1["participant_id"], "client_version": 3},
            ).status_code
            == 200
        )
        selected = client.post(
            f"/rooms/{created['room_code']}/cards/toggle",
            json={
                "participant_id": p2["participant_id"],
                "card_word": "Mot0",
                "client_version": 4,
            },
        )
        assert selected.status_code == 200
        revealed = client.post(
            f"/rooms/{created['room_code']}/cards/reveal",
            json={"participant_id": p2["participant_id"], "client_version": 5},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert revealed.status_code == 200
    assert revealed.json()["revealed_now_words"] == ["Mot0"]
    assert revealed.json()["revealed_card_words"] == ["Mot0"]
    assert state.status_code == 200
    assert state.json()["selected_card_words"] == []
    assert state.json()["revealed_card_words"] == ["Mot0"]


def test_reveal_selected_cards_requires_prior_clue() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p1["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": p2["participant_id"],
                    "card_word": "Mot0",
                    "client_version": 2,
                },
            ).status_code
            == 200
        )
        denied = client.post(
            f"/rooms/{created['room_code']}/cards/reveal",
            json={"participant_id": p2["participant_id"], "client_version": 3},
        )

    assert denied.status_code == 409
    assert denied.json()["detail"]["error_code"] == "clue_required_before_reveal"


def test_toggle_card_selection_rejects_already_revealed_card() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        p1 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        p2 = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": p1["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p1["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p2["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": p1["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": p1["participant_id"], "client_version": 3},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": p2["participant_id"],
                    "card_word": "Mot0",
                    "client_version": 4,
                },
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/reveal",
                json={"participant_id": p2["participant_id"], "client_version": 5},
            ).status_code
            == 200
        )
        denied = client.post(
            f"/rooms/{created['room_code']}/cards/toggle",
            json={
                "participant_id": p2["participant_id"],
                "card_word": "Mot0",
                "client_version": 6,
            },
        )

    assert denied.status_code == 409
    assert denied.json()["detail"]["error_code"] == "round_resolution_active"


def test_reveal_starts_round_resolution_and_continue_round_clears_it() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": guest["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": host["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 3},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": guest["participant_id"],
                    "card_word": "Mot0",
                    "client_version": 4,
                },
            ).status_code
            == 200
        )
        revealed = client.post(
            f"/rooms/{created['room_code']}/cards/reveal",
            json={"participant_id": guest["participant_id"], "client_version": 5},
        )
        assert revealed.status_code == 200
        state_before = client.get(f"/rooms/{created['room_code']}/state")
        assert state_before.status_code == 200
        assert state_before.json()["round_state"] == "round_resolution"
        room = rooms_by_code[created["room_code"]]
        room.round_resolution_started_at_ms = 0
        continued = client.post(
            f"/rooms/{created['room_code']}/round/continue",
            json={"participant_id": host["participant_id"], "client_version": 6},
        )
        state_after = client.get(f"/rooms/{created['room_code']}/state")

    assert continued.status_code == 200
    assert continued.json()["round_number"] == 2
    assert state_after.status_code == 200
    assert state_after.json()["round_state"] == "playing"
    assert state_after.json()["revealed_card_words"] == []


def test_continue_round_rejects_non_host() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        room = rooms_by_code[created["room_code"]]
        room.round_state = "round_resolution"
        room.round_resolution_started_at_ms = 0
        denied = client.post(
            f"/rooms/{created['room_code']}/round/continue",
            json={"participant_id": guest["participant_id"], "client_version": room.turn_version},
        )

    assert denied.status_code == 403
    assert denied.json()["detail"]["error_code"] == "only_host_can_continue_round"


def test_reveal_ends_game_when_score_target_reached(monkeypatch) -> None:
    monkeypatch.setattr("app.main.GAME_SCORE_TARGET", 2)
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": guest["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": host["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 3},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": guest["participant_id"],
                    "card_word": "Mot0",
                    "client_version": 4,
                },
            ).status_code
            == 200
        )
        first_reveal = client.post(
            f"/rooms/{created['room_code']}/cards/reveal",
            json={"participant_id": guest["participant_id"], "client_version": 5},
        )
        assert first_reveal.status_code == 200
        assert first_reveal.json()["phase"] == "in_game"
        assert first_reveal.json()["team_b_score"] == 1
        room = rooms_by_code[created["room_code"]]
        room.round_resolution_started_at_ms = 0
        assert (
            client.post(
                f"/rooms/{created['room_code']}/round/continue",
                json={"participant_id": host["participant_id"], "client_version": 6},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": host["participant_id"], "clue_text": "Route"},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 7},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": guest["participant_id"],
                    "card_word": "Mot1",
                    "client_version": 8,
                },
            ).status_code
            == 200
        )
        final_reveal = client.post(
            f"/rooms/{created['room_code']}/cards/reveal",
            json={"participant_id": guest["participant_id"], "client_version": 9},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")
        blocked_after = client.post(
            f"/rooms/{created['room_code']}/turn/next",
            json={"participant_id": host["participant_id"], "client_version": 10},
        )

    assert final_reveal.status_code == 200
    payload = final_reveal.json()
    assert payload["phase"] == "game_over"
    assert payload["team_b_score"] == 2
    assert payload["winning_team_key"] == "team_b"
    assert payload["game_end_message"]
    assert state.status_code == 200
    assert state.json()["phase"] == "game_over"
    assert blocked_after.status_code == 409
    assert blocked_after.json()["detail"]["error_code"] == "game_over"


def test_withdraw_clue_success_for_author_clears_state() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": guest["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": host["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        wrong_player = client.post(
            f"/rooms/{created['room_code']}/clue/withdraw",
            json={
                "participant_id": guest["participant_id"],
                "client_version": 3,
            },
        )
        withdraw = client.post(
            f"/rooms/{created['room_code']}/clue/withdraw",
            json={
                "participant_id": host["participant_id"],
                "client_version": 3,
            },
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert wrong_player.status_code == 403
    assert wrong_player.json()["detail"]["error_code"] == "clue_withdraw_wrong_player"
    assert withdraw.status_code == 200
    assert withdraw.json()["turn_version"] == 4
    assert state.status_code == 200
    body = state.json()
    assert body["current_clue"] is None
    assert body["current_clue_author_participant_id"] is None
    assert body["clue_withdraw_allowed"] is False


def test_withdraw_clue_blocked_after_guesser_toggle() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": guest["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": host["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 3},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": guest["participant_id"],
                    "card_word": "Mot0",
                    "client_version": 4,
                },
            ).status_code
            == 200
        )
        denied = client.post(
            f"/rooms/{created['room_code']}/clue/withdraw",
            json={
                "participant_id": host["participant_id"],
                "client_version": 5,
            },
        )

    assert denied.status_code == 409
    assert denied.json()["detail"]["error_code"] == "clue_withdraw_blocked"


def test_withdraw_clue_blocked_when_cards_deselected_but_still_touched() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 1},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": guest["participant_id"], "client_version": 2},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/clue",
                json={"participant_id": host["participant_id"], "clue_text": "Voyage"},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/turn/next",
                json={"participant_id": host["participant_id"], "client_version": 3},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": guest["participant_id"],
                    "card_word": "Mot0",
                    "client_version": 4,
                },
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/cards/toggle",
                json={
                    "participant_id": guest["participant_id"],
                    "card_word": "Mot0",
                    "client_version": 5,
                },
            ).status_code
            == 200
        )
        denied = client.post(
            f"/rooms/{created['room_code']}/clue/withdraw",
            json={
                "participant_id": host["participant_id"],
                "client_version": 6,
            },
        )

    assert denied.status_code == 409
    assert denied.json()["detail"]["error_code"] == "clue_withdraw_blocked"


def test_leave_room_rejects_unknown_participant() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        denied = client.post(
            f"/rooms/{created['room_code']}/leave",
            json={"participant_id": "not-a-member"},
        )

    assert denied.status_code == 403
    assert denied.json()["detail"]["error_code"] == "participant_not_in_room"


def test_leave_room_pre_game_transfers_host() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        leave_host = client.post(
            f"/rooms/{created['room_code']}/leave",
            json={"participant_id": host["participant_id"]},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert leave_host.status_code == 200
    body = state.json()
    assert body["phase"] == "pre_game"
    assert len(body["participants"]) == 1
    assert body["participants"][0]["participant_id"] == guest["participant_id"]
    room = rooms_by_code[created["room_code"]]
    assert room.host_participant_id == guest["participant_id"]


def test_leave_room_in_game_three_players_rotates_active_player() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest_two = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Two"},
        ).json()
        assert (
            client.post(
                "/rooms/join",
                json={"room_code": created["room_code"], "pseudo": "Three"},
            ).status_code
            == 200
        )
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        leave_host = client.post(
            f"/rooms/{created['room_code']}/leave",
            json={"participant_id": host["participant_id"]},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert leave_host.status_code == 200
    body = state.json()
    assert body["phase"] == "in_game"
    assert len(body["participants"]) == 2
    assert body["active_participant_id"] == guest_two["participant_id"]


def test_leave_room_in_game_two_players_down_to_one_resets_lobby() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        host = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Host"},
        ).json()
        guest = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Guest"},
        ).json()
        for index in range(MAX_MEGA_DECK_WORDS):
            assert (
                client.post(
                    f"/rooms/{created['room_code']}/mega-deck",
                    json={"word": f"Mot{index}"},
                ).status_code
                == 200
            )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/start",
                json={"participant_id": host["participant_id"]},
            ).status_code
            == 200
        )
        assert (
            client.post(
                f"/rooms/{created['room_code']}/leave",
                json={"participant_id": guest["participant_id"]},
            ).status_code
            == 200
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    body = state.json()
    assert body["phase"] == "pre_game"
    assert len(body["participants"]) == 1
    assert body["participants"][0]["participant_id"] == host["participant_id"]
    assert body["active_participant_id"] is None


def test_leave_room_last_player_empties_participants() -> None:
    reset_storage()
    with TestClient(app) as client:
        created = client.post("/rooms").json()
        solo = client.post(
            "/rooms/join",
            json={"room_code": created["room_code"], "pseudo": "Solo"},
        ).json()
        leave_r = client.post(
            f"/rooms/{created['room_code']}/leave",
            json={"participant_id": solo["participant_id"]},
        )
        state = client.get(f"/rooms/{created['room_code']}/state")

    assert leave_r.status_code == 200
    body = state.json()
    assert body["participants"] == []
    assert body["phase"] == "pre_game"
    assert rooms_by_code[created["room_code"]].participants == []
