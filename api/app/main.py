from __future__ import annotations

import asyncio
import hashlib
import logging
import secrets
import threading
from dataclasses import dataclass
import re
import time
from threading import Lock
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Mousquetaire API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_COOKIE_NAME = "mousquetaire_session"

if not logging.root.handlers:
    logging.basicConfig(level=logging.INFO)
support_log = logging.getLogger("mousquetaire.support")
support_log.setLevel(logging.INFO)

_DIAGNOSTIC_BROADCAST_EVENTS = frozenset(
    {
        "participant_joined",
        "participant_left",
        "host_absence_grace_started",
        "host_absence_grace_cleared",
        "host_transferred_passive",
        "game_finished",
        "round_resolution_started",
    }
)


def session_fingerprint(session_token: str | None) -> str:
    """Empreinte courte du cookie session pour logs support (pas le jeton brut)."""
    if not session_token:
        return "-"
    return hashlib.sha256(session_token.encode("utf-8")).hexdigest()[:16]


@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    raw = (request.headers.get("x-correlation-id") or "").strip()
    correlation_id = raw if 0 < len(raw) <= 128 else str(uuid4())
    request.state.correlation_id = correlation_id
    session_fp = session_fingerprint(request.cookies.get(SESSION_COOKIE_NAME))
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    path = request.url.path
    skip_poll_http_log = request.method == "GET" and (
        path == "/health"
        or path.endswith("/state")
        or path.endswith("/mega-deck")
    )
    if not skip_poll_http_log:
        support_log.info(
            "http_request method=%s path=%s correlation_id=%s status_code=%s session_fp=%s",
            request.method,
            path,
            correlation_id,
            response.status_code,
            session_fp,
        )
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@dataclass
class Room:
    room_id: str
    room_code: str
    participants: list["Participant"]
    mega_deck: list[str]
    phase: str
    host_participant_id: str | None
    variant_key: str
    teams_count: int
    grid_size: int
    black_words: int
    participant_roles: dict[str, str]
    turn_version: int
    active_participant_id: str | None
    active_role: str | None
    current_clue: str | None
    board_cards: list[str]
    selected_card_words: list[str]
    revealed_card_words: list[str]
    round_state: str
    round_result_message: str | None
    round_resolution_started_at_ms: int | None
    round_number: int
    team_a_score: int
    team_b_score: int
    winning_team_key: str | None
    game_end_message: str | None
    current_clue_author_participant_id: str | None
    clue_selection_touched: bool
    host_absence_grace_until_ms: int | None


@dataclass
class Participant:
    participant_id: str
    pseudo: str


class CreateRoomResponse(BaseModel):
    room_id: str
    room_code: str
    diagnostic_ref: str


class JoinRoomRequest(BaseModel):
    room_code: str = Field(min_length=6, max_length=6)
    pseudo: str = Field(min_length=2, max_length=24)


class JoinRoomResponse(BaseModel):
    room_id: str
    room_code: str
    participant_id: str
    pseudo: str
    is_host: bool
    player_status: str
    room_phase: str
    status_message: str
    session_resumed: bool
    diagnostic_ref: str


class ParticipantSummary(BaseModel):
    participant_id: str
    pseudo: str


class LeaveRoomRequest(BaseModel):
    participant_id: str = Field(min_length=1)


class LeaveRoomResponse(BaseModel):
    room_id: str
    room_code: str
    phase: str
    turn_version: int
    participants_remaining: int


class AddMegaDeckWordRequest(BaseModel):
    word: str = Field(min_length=1, max_length=32)


class MegaDeckResponse(BaseModel):
    room_id: str
    room_code: str
    words: list[str]
    max_words: int


class RoomStateResponse(BaseModel):
    room_id: str
    room_code: str
    phase: str
    variant_key: str
    teams_count: int
    grid_size: int
    black_words: int
    participant_roles: dict[str, str]
    turn_version: int
    active_participant_id: str | None
    active_role: str | None
    current_clue: str | None
    board_cards: list[str]
    selected_card_words: list[str]
    revealed_card_words: list[str]
    round_state: str
    round_result_message: str | None
    round_resolution_started_at_ms: int | None
    round_resolution_beat_ms: int
    round_number: int
    next_step_hint: str | None
    team_a_score: int
    team_b_score: int
    game_score_target: int
    winning_team_key: str | None
    game_end_message: str | None
    current_clue_author_participant_id: str | None
    clue_withdraw_allowed: bool
    participants: list[ParticipantSummary]
    can_start: bool
    blocked_reasons: list[str]
    host_participant_id: str | None
    host_absence_grace_until_ms: int | None


class StartGameRequest(BaseModel):
    participant_id: str = Field(min_length=1)


class StartGameResponse(BaseModel):
    room_id: str
    room_code: str
    phase: str
    variant_key: str
    teams_count: int
    grid_size: int
    black_words: int
    participant_roles: dict[str, str]
    turn_version: int
    active_participant_id: str | None
    active_role: str | None


class AdvanceTurnRequest(BaseModel):
    participant_id: str = Field(min_length=1)
    client_version: int | None = None


class AdvanceTurnResponse(BaseModel):
    room_id: str
    room_code: str
    turn_version: int
    active_participant_id: str
    active_role: str


class SubmitClueRequest(BaseModel):
    participant_id: str = Field(min_length=1)
    clue_text: str = Field(min_length=1, max_length=32)


class SubmitClueResponse(BaseModel):
    room_id: str
    room_code: str
    clue_text: str
    clue_giver_participant_id: str
    turn_version: int


class WithdrawClueRequest(BaseModel):
    participant_id: str = Field(min_length=1)
    client_version: int | None = None


class WithdrawClueResponse(BaseModel):
    room_id: str
    room_code: str
    turn_version: int


class ToggleCardSelectionRequest(BaseModel):
    participant_id: str = Field(min_length=1)
    card_word: str = Field(min_length=1, max_length=32)
    client_version: int | None = None


class ToggleCardSelectionResponse(BaseModel):
    room_id: str
    room_code: str
    selected_card_words: list[str]
    turn_version: int


class RevealCardsRequest(BaseModel):
    participant_id: str = Field(min_length=1)
    client_version: int | None = None


class RevealCardsResponse(BaseModel):
    room_id: str
    room_code: str
    revealed_card_words: list[str]
    revealed_now_words: list[str]
    turn_version: int
    round_state: str
    round_result_message: str | None
    round_resolution_started_at_ms: int | None
    round_resolution_beat_ms: int
    round_number: int
    next_step_hint: str | None
    phase: str
    team_a_score: int
    team_b_score: int
    game_score_target: int
    winning_team_key: str | None
    game_end_message: str | None


class ContinueRoundRequest(BaseModel):
    participant_id: str = Field(min_length=1)
    client_version: int | None = None


class ContinueRoundResponse(BaseModel):
    room_id: str
    room_code: str
    round_number: int
    turn_version: int
    active_participant_id: str | None
    active_role: str | None


rooms_by_code: dict[str, Room] = {}
room_websocket_connections: dict[str, list[WebSocket]] = {}
rooms_lock = Lock()

# Compte connexions WebSocket temps reel par (salle, participant) pour Story 4.4 (disparition hote passive).
room_participant_live_ws: dict[str, dict[str, int]] = {}

SESSION_MAX_AGE_S = 60 * 60 * 8
session_by_token: dict[str, str] = {}
session_token_by_participant: dict[str, str] = {}


def clear_session_binding(token: str | None) -> None:
    if not token:
        return
    participant_id = session_by_token.pop(token, None)
    if participant_id is None:
        return
    if session_token_by_participant.get(participant_id) == token:
        session_token_by_participant.pop(participant_id, None)


def bind_session_token(token: str, participant_id: str) -> None:
    old_token = session_token_by_participant.get(participant_id)
    if old_token and old_token != token:
        session_by_token.pop(old_token, None)
    session_by_token[token] = participant_id
    session_token_by_participant[participant_id] = token


def unregister_participant_session(participant_id: str) -> None:
    token = session_token_by_participant.pop(participant_id, None)
    if token:
        session_by_token.pop(token, None)


def attach_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_MAX_AGE_S,
    )


MAX_PLAYERS_PER_ROOM = 8
ROOM_CODE_LENGTH = 6
MAX_MEGA_DECK_WORDS = 25
MIN_PLAYERS_TO_START = 2
VARIANT_KEY_P0 = "mousquetaire_p0"
VARIANT_TEAMS_COUNT = 2
VARIANT_GRID_SIZE = 5
VARIANT_BLACK_WORDS = 1
MAX_CLUE_LENGTH = 24
CLUE_PATTERN = re.compile(r"^[A-Za-zÀ-ÿ\-\s]+$")
ROUND_RESOLUTION_BEAT_MS = 3000
ROUND_END_REVEAL_THRESHOLD = 1
GAME_SCORE_TARGET = 8

# Grace passive host WS disconnect before automatic host transfer (FR28 / Story 4.4). Tests may monkeypatch.
HOST_WS_ABSENCE_GRACE_MS = 90_000

JOIN_MSG_LOBBY = "Salon pre-partie — contribuez au mega-deck avec la table."
JOIN_MSG_PLAYER = "Vous participez a la partie avec un role actif."
JOIN_MSG_SPECTATOR_INGAME = (
    "Partie en cours — spectateur : observation uniquement, pas d'actions de jeu."
)
JOIN_MSG_SPECTATOR_GAMEOVER = (
    "Partie terminee — spectateur : vous consultez le resultat avec la table."
)


def ws_live_count(room_code: str, participant_id: str) -> int:
    return room_participant_live_ws.get(room_code, {}).get(participant_id, 0)


def ws_adjust(room_code: str, participant_id: str, delta: int) -> None:
    outer = room_participant_live_ws.setdefault(room_code, {})
    next_val = max(0, outer.get(participant_id, 0) + delta)
    if next_val == 0:
        outer.pop(participant_id, None)
        if not outer:
            room_participant_live_ws.pop(room_code, None)
    else:
        outer[participant_id] = next_val


def ws_clear_participant(room_code: str, participant_id: str) -> None:
    if room_code in room_participant_live_ws:
        room_participant_live_ws[room_code].pop(participant_id, None)
        if not room_participant_live_ws[room_code]:
            room_participant_live_ws.pop(room_code, None)


def transfer_host_after_passive_absence(room: Room, old_host_id: str) -> None:
    for participant in room.participants:
        if participant.participant_id != old_host_id:
            room.host_participant_id = participant.participant_id
            return
    room.host_participant_id = None


def generate_room_code() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(ROOM_CODE_LENGTH))


def create_room() -> Room:
    for _ in range(10):
        room_code = generate_room_code()
        with rooms_lock:
            if room_code not in rooms_by_code:
                room = Room(
                    room_id=str(uuid4()),
                    room_code=room_code,
                    participants=[],
                    mega_deck=[],
                    phase="pre_game",
                    host_participant_id=None,
                    variant_key=VARIANT_KEY_P0,
                    teams_count=VARIANT_TEAMS_COUNT,
                    grid_size=VARIANT_GRID_SIZE,
                    black_words=VARIANT_BLACK_WORDS,
                    participant_roles={},
                    turn_version=0,
                    active_participant_id=None,
                    active_role=None,
                    current_clue=None,
                    board_cards=[],
                    selected_card_words=[],
                    revealed_card_words=[],
                    round_state="playing",
                    round_result_message=None,
                    round_resolution_started_at_ms=None,
                    round_number=1,
                    team_a_score=0,
                    team_b_score=0,
                    winning_team_key=None,
                    game_end_message=None,
                    current_clue_author_participant_id=None,
                    clue_selection_touched=False,
                    host_absence_grace_until_ms=None,
                )
                rooms_by_code[room_code] = room
                return room
    raise RuntimeError("failed_to_allocate_unique_room_code")


def get_start_blocked_reasons(room: Room) -> list[str]:
    blocked_reasons: list[str] = []
    if room.phase != "pre_game":
        blocked_reasons.append("La partie est deja en cours.")
    if len(room.participants) < MIN_PLAYERS_TO_START:
        blocked_reasons.append(
            f"Il faut au moins {MIN_PLAYERS_TO_START} joueurs pour demarrer."
        )
    if len(room.mega_deck) < MAX_MEGA_DECK_WORDS:
        blocked_reasons.append(
            f"Le mega-deck doit etre complet ({MAX_MEGA_DECK_WORDS} mots requis)."
        )
    return blocked_reasons


def build_p0_roles(participants: list[Participant]) -> dict[str, str]:
    roles: dict[str, str] = {}
    for index, participant in enumerate(participants):
        if index == 0:
            roles[participant.participant_id] = "clue_giver_team_a"
        elif index == 1 and len(participants) > 2:
            roles[participant.participant_id] = "clue_giver_team_b"
        elif index % 2 == 0:
            roles[participant.participant_id] = "guesser_team_a"
        else:
            roles[participant.participant_id] = "guesser_team_b"
    return roles


def is_round_resolution_active(room: Room) -> bool:
    if room.round_state != "round_resolution" or room.round_resolution_started_at_ms is None:
        return False
    now_ms = int(time.time() * 1000)
    return now_ms < room.round_resolution_started_at_ms + ROUND_RESOLUTION_BEAT_MS


def clear_current_clue(room: Room) -> None:
    room.current_clue = None
    room.current_clue_author_participant_id = None
    room.clue_selection_touched = False


def compute_clue_withdraw_allowed(room: Room) -> bool:
    return (
        room.phase == "in_game"
        and room.round_state != "round_resolution"
        and room.current_clue is not None
        and room.current_clue_author_participant_id is not None
        and not room.clue_selection_touched
        and len(room.selected_card_words) == 0
    )


def describe_join_context(room: Room, participant_id: str) -> tuple[str, str, str]:
    phase = room.phase
    role = room.participant_roles.get(participant_id)
    if phase == "pre_game":
        return ("lobby", phase, JOIN_MSG_LOBBY)
    if role:
        return ("player", phase, JOIN_MSG_PLAYER)
    if phase == "game_over":
        return ("spectator", phase, JOIN_MSG_SPECTATOR_GAMEOVER)
    return ("spectator", phase, JOIN_MSG_SPECTATOR_INGAME)


def pick_first_participant_with_role_or_fallback(room: Room) -> str | None:
    if not room.participants:
        return None
    for entry in room.participants:
        if entry.participant_id in room.participant_roles:
            return entry.participant_id
    return room.participants[0].participant_id


def ensure_gameplay_participant(room: Room, participant_id: str) -> None:
    if participant_id not in room.participant_roles:
        raise HTTPException(
            status_code=403,
            detail={
                "error_code": "spectator_action_forbidden",
                "message": "Les spectateurs ne peuvent pas effectuer cette action.",
            },
        )


def clear_selection_state(room: Room) -> None:
    room.selected_card_words = []
    room.clue_selection_touched = False


def participants_snapshot(room: Room) -> list[ParticipantSummary]:
    return [
        ParticipantSummary(participant_id=p.participant_id, pseudo=p.pseudo)
        for p in room.participants
    ]


def rollback_room_to_pre_game_lobby(room: Room) -> None:
    room.phase = "pre_game"
    clear_current_clue(room)
    clear_selection_state(room)
    room.board_cards = []
    room.revealed_card_words = []
    room.round_state = "playing"
    room.round_result_message = None
    room.round_resolution_started_at_ms = None
    room.round_number = 1
    room.team_a_score = 0
    room.team_b_score = 0
    room.winning_team_key = None
    room.game_end_message = None
    room.participant_roles = {}
    room.active_participant_id = None
    room.active_role = None
    room.host_absence_grace_until_ms = None


def resolve_active_after_leave(room: Room, leaving_id: str, old_order_ids: list[str]) -> None:
    remaining = [pid for pid in old_order_ids if pid != leaving_id]
    if not remaining:
        room.active_participant_id = None
        room.active_role = None
        return

    remaining_set = set(remaining)
    room.participant_roles = {
        pid: role for pid, role in room.participant_roles.items() if pid in remaining_set
    }

    prior_active = room.active_participant_id

    if (
        prior_active != leaving_id
        and prior_active in remaining_set
        and prior_active in room.participant_roles
    ):
        room.active_role = room.participant_roles[prior_active]
        return

    def assign_next_gameplay(start_pid: str | None) -> None:
        start_idx = (
            old_order_ids.index(start_pid)
            if start_pid is not None and start_pid in old_order_ids
            else -1
        )
        for offset in range(1, len(old_order_ids)):
            cand = old_order_ids[(start_idx + offset) % len(old_order_ids)]
            if cand in remaining_set and cand in room.participant_roles:
                room.active_participant_id = cand
                room.active_role = room.participant_roles[cand]
                clear_selection_state(room)
                return
        for cand in remaining:
            if cand in room.participant_roles:
                room.active_participant_id = cand
                room.active_role = room.participant_roles[cand]
                clear_selection_state(room)
                return
        room.active_participant_id = None
        room.active_role = None

    if prior_active == leaving_id:
        assign_next_gameplay(leaving_id)
        return

    assign_next_gameplay(prior_active)


def broadcast_payload_for_room(room: Room) -> dict[str, object]:
    return {
        "room_id": room.room_id,
        "room_code": room.room_code,
        "phase": room.phase,
        "active_participant_id": room.active_participant_id,
        "active_role": room.active_role,
        "current_clue": room.current_clue,
        "board_cards": room.board_cards,
        "selected_card_words": room.selected_card_words,
        "revealed_card_words": room.revealed_card_words,
        "round_state": room.round_state,
        "round_result_message": room.round_result_message,
        "round_resolution_started_at_ms": room.round_resolution_started_at_ms,
        "round_resolution_beat_ms": ROUND_RESOLUTION_BEAT_MS,
        "round_number": room.round_number,
        "next_step_hint": "next_round" if room.round_state == "round_resolution" else None,
        "team_a_score": room.team_a_score,
        "team_b_score": room.team_b_score,
        "game_score_target": GAME_SCORE_TARGET,
        "winning_team_key": room.winning_team_key,
        "game_end_message": room.game_end_message,
        "current_clue_author_participant_id": room.current_clue_author_participant_id,
        "clue_withdraw_allowed": compute_clue_withdraw_allowed(room),
        "host_participant_id": room.host_participant_id,
        "host_absence_grace_until_ms": room.host_absence_grace_until_ms,
        "participants": [
            {"participant_id": p.participant_id, "pseudo": p.pseudo} for p in room.participants
        ],
    }


async def broadcast_room_event(room: Room, event_type: str) -> None:
    if event_type in _DIAGNOSTIC_BROADCAST_EVENTS:
        subscriber_count = len(room_websocket_connections.get(room.room_code, []))
        support_log.info(
            "ws_broadcast event_type=%s room_id=%s room_code=%s turn_version=%s subscriber_count=%s",
            event_type,
            room.room_id,
            room.room_code,
            room.turn_version,
            subscriber_count,
        )
    sockets = room_websocket_connections.get(room.room_code, [])
    if not sockets:
        return
    event_payload = {
        "type": event_type,
        "payload": broadcast_payload_for_room(room),
        "version": room.turn_version,
    }
    disconnected: list[WebSocket] = []
    for socket in sockets:
        try:
            await socket.send_json(event_payload)
        except RuntimeError:
            disconnected.append(socket)
    if disconnected:
        room_websocket_connections[room.room_code] = [
            socket for socket in sockets if socket not in disconnected
        ]


def host_absence_try_transfer_after_grace(
    room_code: str, former_host_id: str, grace_until_ms: int
) -> Room | None:
    """Transfert d'hote si la fenetre de grace est toujours active et l'hote sans flux WS."""
    room_snapshot: Room | None = None
    with rooms_lock:
        room = rooms_by_code.get(room_code)
        if room is None:
            return None
        if room.host_participant_id != former_host_id:
            return None
        if room.host_absence_grace_until_ms != grace_until_ms:
            return None
        if ws_live_count(room_code, former_host_id) > 0:
            return None
        transfer_host_after_passive_absence(room, former_host_id)
        room.host_absence_grace_until_ms = None
        room.turn_version += 1
        room_snapshot = room
    return room_snapshot


def schedule_host_absence_transfer(
    room_code: str, former_host_id: str, grace_until_ms: int
) -> None:
    delay_s = HOST_WS_ABSENCE_GRACE_MS / 1000.0

    def worker() -> None:
        room_gone = host_absence_try_transfer_after_grace(
            room_code, former_host_id, grace_until_ms
        )
        if room_gone is not None:
            asyncio.run(broadcast_room_event(room_gone, "host_transferred_passive"))

    threading.Timer(delay_s, worker).start()


@app.post("/rooms", response_model=CreateRoomResponse, status_code=201)
async def create_room_endpoint(request: Request) -> CreateRoomResponse:
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    try:
        room = create_room()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": "room_creation_failed",
                "message": "Impossible de creer la salle pour le moment. Reessayez.",
            },
        ) from exc
    diagnostic_ref = str(uuid4())
    support_log.info(
        "room_created correlation_id=%s diagnostic_ref=%s room_id=%s room_code=%s",
        correlation_id,
        diagnostic_ref,
        room.room_id,
        room.room_code,
    )
    return CreateRoomResponse(
        room_id=room.room_id, room_code=room.room_code, diagnostic_ref=diagnostic_ref
    )


@app.post("/rooms/join", response_model=JoinRoomResponse)
async def join_room_endpoint(
    payload: JoinRoomRequest, response: Response, request: Request
) -> JoinRoomResponse:
    room_code = payload.room_code.strip().upper()
    pseudo = payload.pseudo.strip()
    if len(pseudo) < 2:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "pseudo_invalid",
                "message": "Le pseudo doit contenir au moins 2 caracteres.",
            },
        )
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    existing_cookie = request.cookies.get(SESSION_COOKIE_NAME)
    session_fp = session_fingerprint(existing_cookie)
    broadcast_mid_game_join = False
    resumed = False
    participant: Participant | None = None
    token_out: str

    with rooms_lock:
        room = rooms_by_code.get(room_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )

        if existing_cookie:
            bound_pid = session_by_token.get(existing_cookie)
            if bound_pid:
                bound_participant = next(
                    (p for p in room.participants if p.participant_id == bound_pid),
                    None,
                )
                if bound_participant is not None and bound_participant.pseudo == pseudo:
                    participant = bound_participant
                else:
                    clear_session_binding(existing_cookie)

        if participant is None:
            if len(room.participants) >= MAX_PLAYERS_PER_ROOM:
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error_code": "room_full",
                        "message": f"Salle complete ({MAX_PLAYERS_PER_ROOM} joueurs max).",
                    },
                )
            phase_before_append = room.phase
            participant = Participant(participant_id=str(uuid4()), pseudo=pseudo)
            room.participants.append(participant)
            if phase_before_append == "pre_game":
                if room.host_participant_id is None:
                    room.host_participant_id = participant.participant_id
            else:
                room.turn_version += 1
                broadcast_mid_game_join = True

            token_out = secrets.token_urlsafe(24)
            bind_session_token(token_out, participant.participant_id)
        else:
            resumed = True
            assert existing_cookie is not None
            token_out = existing_cookie
            bind_session_token(token_out, participant.participant_id)

        player_status, room_phase_snapshot, status_message = describe_join_context(
            room, participant.participant_id
        )

    attach_session_cookie(response, token_out)
    if broadcast_mid_game_join:
        await broadcast_room_event(room, "participant_joined")
    diagnostic_ref = str(uuid4())
    support_log.info(
        "participant_join correlation_id=%s diagnostic_ref=%s room_id=%s room_code=%s "
        "participant_id=%s session_resumed=%s session_fp=%s",
        correlation_id,
        diagnostic_ref,
        room.room_id,
        room.room_code,
        participant.participant_id,
        resumed,
        session_fp,
    )
    return JoinRoomResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        participant_id=participant.participant_id,
        pseudo=participant.pseudo,
        is_host=participant.participant_id == room.host_participant_id,
        player_status=player_status,
        room_phase=room_phase_snapshot,
        status_message=status_message,
        session_resumed=resumed,
        diagnostic_ref=diagnostic_ref,
    )


@app.post("/rooms/{room_code}/leave", response_model=LeaveRoomResponse)
async def leave_room(room_code: str, payload: LeaveRoomRequest, request: Request) -> LeaveRoomResponse:
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        participant_ids = {participant.participant_id for participant in room.participants}
        if payload.participant_id not in participant_ids:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "participant_not_in_room",
                    "message": "Participant inconnu pour cette salle.",
                },
            )
        unregister_participant_session(payload.participant_id)
        ws_clear_participant(normalized_code, payload.participant_id)
        room.host_absence_grace_until_ms = None
        old_order_ids = [participant.participant_id for participant in room.participants]
        leaving_id = payload.participant_id

        if room.current_clue_author_participant_id == leaving_id:
            clear_current_clue(room)
            clear_selection_state(room)

        room.participants = [
            participant for participant in room.participants if participant.participant_id != leaving_id
        ]

        if room.host_participant_id == leaving_id:
            room.host_participant_id = pick_first_participant_with_role_or_fallback(room)

        count_after = len(room.participants)

        if count_after == 0:
            room.host_participant_id = None
            rollback_room_to_pre_game_lobby(room)
        elif room.phase == "in_game" and count_after < MIN_PLAYERS_TO_START:
            rollback_room_to_pre_game_lobby(room)
        elif room.phase == "in_game":
            resolve_active_after_leave(room, leaving_id, old_order_ids)
        elif room.phase == "game_over":
            remaining_ids = {p.participant_id for p in room.participants}
            room.participant_roles = {
                pid: role for pid, role in room.participant_roles.items() if pid in remaining_ids
            }
            pa = room.active_participant_id
            if pa is None or pa == leaving_id or pa not in remaining_ids:
                room.active_participant_id = pick_first_participant_with_role_or_fallback(room)
                room.active_role = (
                    room.participant_roles.get(room.active_participant_id)
                    if room.active_participant_id
                    else None
                )
            else:
                room.active_role = room.participant_roles.get(pa)
        else:
            remaining_ids = {p.participant_id for p in room.participants}
            room.participant_roles = {
                pid: role for pid, role in room.participant_roles.items() if pid in remaining_ids
            }
            room.active_participant_id = None
            room.active_role = None

        room.turn_version += 1
        room_for_broadcast = room

    await broadcast_room_event(room_for_broadcast, "participant_left")
    remaining = len(room_for_broadcast.participants)
    support_log.info(
        "participant_leave correlation_id=%s room_id=%s room_code=%s participant_id=%s "
        "turn_version=%s participants_remaining=%s",
        correlation_id,
        room_for_broadcast.room_id,
        room_for_broadcast.room_code,
        payload.participant_id,
        room_for_broadcast.turn_version,
        remaining,
    )
    return LeaveRoomResponse(
        room_id=room_for_broadcast.room_id,
        room_code=room_for_broadcast.room_code,
        phase=room_for_broadcast.phase,
        turn_version=room_for_broadcast.turn_version,
        participants_remaining=remaining,
    )


@app.get("/rooms/{room_code}/mega-deck", response_model=MegaDeckResponse)
async def get_mega_deck(room_code: str) -> MegaDeckResponse:
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        words = list(room.mega_deck)
    return MegaDeckResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        words=words,
        max_words=MAX_MEGA_DECK_WORDS,
    )


@app.get("/rooms/{room_code}/state", response_model=RoomStateResponse)
async def get_room_state(room_code: str) -> RoomStateResponse:
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        blocked_reasons = get_start_blocked_reasons(room)
        return RoomStateResponse(
            room_id=room.room_id,
            room_code=room.room_code,
            phase=room.phase,
            variant_key=room.variant_key,
            teams_count=room.teams_count,
            grid_size=room.grid_size,
            black_words=room.black_words,
            participant_roles=room.participant_roles,
            turn_version=room.turn_version,
            active_participant_id=room.active_participant_id,
            active_role=room.active_role,
            current_clue=room.current_clue,
            board_cards=room.board_cards,
            selected_card_words=room.selected_card_words,
            revealed_card_words=room.revealed_card_words,
            round_state=room.round_state,
            round_result_message=room.round_result_message,
            round_resolution_started_at_ms=room.round_resolution_started_at_ms,
            round_resolution_beat_ms=ROUND_RESOLUTION_BEAT_MS,
            round_number=room.round_number,
            next_step_hint="next_round" if room.round_state == "round_resolution" else None,
            team_a_score=room.team_a_score,
            team_b_score=room.team_b_score,
            game_score_target=GAME_SCORE_TARGET,
            winning_team_key=room.winning_team_key,
            game_end_message=room.game_end_message,
            current_clue_author_participant_id=room.current_clue_author_participant_id,
            clue_withdraw_allowed=compute_clue_withdraw_allowed(room),
            participants=participants_snapshot(room),
            can_start=len(blocked_reasons) == 0,
            blocked_reasons=blocked_reasons,
            host_participant_id=room.host_participant_id,
            host_absence_grace_until_ms=room.host_absence_grace_until_ms,
        )


@app.post("/rooms/{room_code}/start", response_model=StartGameResponse)
async def start_game(room_code: str, payload: StartGameRequest) -> StartGameResponse:
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if payload.participant_id != room.host_participant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "only_host_can_start",
                    "message": "Seul l'hote peut demarrer la partie.",
                },
            )
        blocked_reasons = get_start_blocked_reasons(room)
        if blocked_reasons:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "start_conditions_not_met",
                    "message": blocked_reasons[0],
                    "blocked_reasons": blocked_reasons,
                },
            )
        room.phase = "in_game"
        room.participant_roles = build_p0_roles(room.participants)
        room.turn_version = 1
        room.active_participant_id = room.participants[0].participant_id
        room.active_role = room.participant_roles.get(room.active_participant_id)
        clear_current_clue(room)
        room.board_cards = list(room.mega_deck)
        room.selected_card_words = []
        room.revealed_card_words = []
        room.round_state = "playing"
        room.round_result_message = None
        room.round_resolution_started_at_ms = None
        room.round_number = 1
        room.team_a_score = 0
        room.team_b_score = 0
        room.winning_team_key = None
        room.game_end_message = None
        room_for_broadcast = room
    await broadcast_room_event(room_for_broadcast, "turn_changed")
    return StartGameResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        phase=room.phase,
        variant_key=room.variant_key,
        teams_count=room.teams_count,
        grid_size=room.grid_size,
        black_words=room.black_words,
        participant_roles=room.participant_roles,
        turn_version=room.turn_version,
        active_participant_id=room.active_participant_id,
        active_role=room.active_role,
    )


@app.post("/rooms/{room_code}/turn/next", response_model=AdvanceTurnResponse)
async def advance_turn(room_code: str, payload: AdvanceTurnRequest) -> AdvanceTurnResponse:
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if room.phase == "game_over":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_over",
                    "message": "La partie est terminee.",
                },
            )
        if room.phase != "in_game":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_not_started",
                    "message": "La partie n'est pas encore demarree.",
                },
            )
        if room.round_state == "round_resolution":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "round_resolution_active",
                    "message": "Fin de manche en cours. Patientez avant la transition.",
                },
            )
        if payload.client_version is not None and payload.client_version != room.turn_version:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "turn_version_conflict",
                    "message": "Version de tour obsolete. Resynchronisez votre etat.",
                    "server_version": room.turn_version,
                },
            )
        participant_ids = [participant.participant_id for participant in room.participants]
        if payload.participant_id not in participant_ids:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "participant_not_in_room",
                    "message": "Participant inconnu pour cette salle.",
                },
            )
        ensure_gameplay_participant(room, payload.participant_id)
        gameplay_ids = [
            participant.participant_id
            for participant in room.participants
            if participant.participant_id in room.participant_roles
        ]
        if not gameplay_ids:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_state_invalid",
                    "message": "Aucun joueur avec role actif dans cette salle.",
                },
            )
        if (
            room.active_participant_id is None
            or room.active_participant_id not in gameplay_ids
        ):
            room.active_participant_id = gameplay_ids[0]
        if payload.participant_id != room.active_participant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "not_your_turn",
                    "message": "Ce n'est pas votre tour d'agir.",
                },
            )
        current_index = gameplay_ids.index(room.active_participant_id)
        next_index = (current_index + 1) % len(gameplay_ids)
        room.active_participant_id = gameplay_ids[next_index]
        room.active_role = room.participant_roles.get(room.active_participant_id)
        if (room.active_role or "").startswith("clue_giver_"):
            clear_current_clue(room)
        room.selected_card_words = []
        room.turn_version += 1
        room_for_broadcast = room

    await broadcast_room_event(room_for_broadcast, "turn_changed")
    return AdvanceTurnResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        turn_version=room.turn_version,
        active_participant_id=room.active_participant_id,
        active_role=room.active_role or "unknown_role",
    )


@app.websocket("/rooms/{room_code}/events")
async def room_events_socket(
    websocket: WebSocket,
    room_code: str,
    participant_id: str | None = Query(default=None),
    correlation_id: str | None = Query(default=None),
) -> None:
    normalized_code = room_code.strip().upper()
    ws_corr_raw = (correlation_id or "").strip()
    ws_cid = ws_corr_raw if 0 < len(ws_corr_raw) <= 128 else str(uuid4())
    await websocket.accept()

    validated_pid: str | None = None
    if participant_id is not None:
        stripped = participant_id.strip()
        if stripped:
            validated_pid = stripped

    room_missing = False
    pid_invalid = False
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            room_missing = True
        elif validated_pid is not None and not any(
            p.participant_id == validated_pid for p in room.participants
        ):
            pid_invalid = True

    if room_missing:
        await websocket.send_json(
            {
                "type": "error",
                "payload": {
                    "message": "Code de salle invalide ou salle indisponible.",
                },
                "version": 0,
            }
        )
        await websocket.close()
        return
    if pid_invalid:
        await websocket.send_json(
            {
                "type": "error",
                "payload": {
                    "error_code": "websocket_participant_invalid",
                    "message": "Participant inconnu pour cette salle.",
                },
                "version": 0,
            }
        )
        await websocket.close()
        return

    reconnect_room: Room | None = None
    reconnect_evt: str | None = None
    snapshot_data: dict[str, object] | None = None
    room_id_open: str = ""
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        assert room is not None
        room_id_open = room.room_id
        room_websocket_connections.setdefault(normalized_code, []).append(websocket)
        if validated_pid is not None:
            ws_adjust(normalized_code, validated_pid, 1)
            if (
                validated_pid == room.host_participant_id
                and room.host_absence_grace_until_ms is not None
            ):
                room.host_absence_grace_until_ms = None
                room.turn_version += 1
                reconnect_room = room
                reconnect_evt = "host_absence_grace_cleared"
        snapshot_data = {
            "type": "turn_snapshot",
            "payload": broadcast_payload_for_room(room),
            "version": room.turn_version,
        }
    assert snapshot_data is not None
    await websocket.send_json(snapshot_data)
    if reconnect_room is not None and reconnect_evt is not None:
        await broadcast_room_event(reconnect_room, reconnect_evt)

    support_log.info(
        "websocket_open correlation_id=%s room_id=%s room_code=%s participant_id=%s",
        ws_cid,
        room_id_open,
        normalized_code,
        validated_pid or "-",
    )

    grace_task_room_code: str | None = None
    grace_task_host_id: str | None = None
    grace_task_until: int | None = None

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        support_log.info(
            "websocket_close correlation_id=%s room_code=%s participant_id=%s",
            ws_cid,
            normalized_code,
            validated_pid or "-",
        )
        disconnect_room: Room | None = None
        disconnect_evt: str | None = None
        with rooms_lock:
            sockets = room_websocket_connections.get(normalized_code, [])
            room_websocket_connections[normalized_code] = [
                socket for socket in sockets if socket != websocket
            ]
            if validated_pid is not None:
                ws_adjust(normalized_code, validated_pid, -1)
                room_dc = rooms_by_code.get(normalized_code)
                if room_dc is not None:
                    if (
                        validated_pid == room_dc.host_participant_id
                        and ws_live_count(normalized_code, validated_pid) == 0
                    ):
                        now_ms = int(time.time() * 1000)
                        room_dc.host_absence_grace_until_ms = now_ms + HOST_WS_ABSENCE_GRACE_MS
                        room_dc.turn_version += 1
                        disconnect_room = room_dc
                        disconnect_evt = "host_absence_grace_started"
                        grace_task_room_code = normalized_code
                        grace_task_host_id = validated_pid
                        grace_task_until = room_dc.host_absence_grace_until_ms
        if disconnect_room is not None and disconnect_evt is not None:
            await broadcast_room_event(disconnect_room, disconnect_evt)
        if (
            grace_task_room_code is not None
            and grace_task_host_id is not None
            and grace_task_until is not None
        ):
            if HOST_WS_ABSENCE_GRACE_MS <= 0:
                transferred_room = host_absence_try_transfer_after_grace(
                    grace_task_room_code,
                    grace_task_host_id,
                    grace_task_until,
                )
                if transferred_room is not None:
                    await broadcast_room_event(transferred_room, "host_transferred_passive")
            else:
                schedule_host_absence_transfer(
                    grace_task_room_code,
                    grace_task_host_id,
                    grace_task_until,
                )


@app.post("/rooms/{room_code}/clue", response_model=SubmitClueResponse)
async def submit_clue(room_code: str, payload: SubmitClueRequest) -> SubmitClueResponse:
    normalized_code = room_code.strip().upper()
    clue_text = payload.clue_text.strip()
    if len(clue_text) < 2:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "clue_too_short",
                "message": "L'indice doit contenir au moins 2 caracteres.",
            },
        )
    if len(clue_text) > MAX_CLUE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "clue_too_long",
                "message": f"L'indice ne doit pas depasser {MAX_CLUE_LENGTH} caracteres.",
            },
        )
    if not CLUE_PATTERN.match(clue_text):
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "clue_invalid_characters",
                "message": "L'indice contient des caracteres interdits.",
            },
        )

    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if room.phase == "game_over":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_over",
                    "message": "La partie est terminee.",
                },
            )
        if room.phase != "in_game":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_not_started",
                    "message": "La partie n'est pas encore demarree.",
                },
            )
        if room.round_state == "round_resolution":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "round_resolution_active",
                    "message": "Fin de manche en cours. Patientez avant la transition.",
                },
            )
        participant_ids = [participant.participant_id for participant in room.participants]
        if payload.participant_id not in participant_ids:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "participant_not_in_room",
                    "message": "Participant inconnu pour cette salle.",
                },
            )
        ensure_gameplay_participant(room, payload.participant_id)
        if payload.participant_id != room.active_participant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "not_your_turn",
                    "message": "Ce n'est pas votre tour d'agir.",
                },
            )
        if not (room.active_role or "").startswith("clue_giver_"):
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "role_not_allowed_to_submit_clue",
                    "message": "Seul le donneur d'indice actif peut valider un indice.",
                },
            )
        if room.current_clue is not None:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "clue_already_submitted",
                    "message": "Un indice est deja valide pour ce tour.",
                },
            )
        room.current_clue = clue_text
        room.current_clue_author_participant_id = payload.participant_id
        room.clue_selection_touched = False
        room_for_broadcast = room

    await broadcast_room_event(room_for_broadcast, "clue_submitted")
    return SubmitClueResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        clue_text=room.current_clue or "",
        clue_giver_participant_id=payload.participant_id,
        turn_version=room.turn_version,
    )


@app.post("/rooms/{room_code}/clue/withdraw", response_model=WithdrawClueResponse)
async def withdraw_clue(room_code: str, payload: WithdrawClueRequest) -> WithdrawClueResponse:
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if room.phase == "game_over":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_over",
                    "message": "La partie est terminee.",
                },
            )
        if room.phase != "in_game":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_not_started",
                    "message": "La partie n'est pas encore demarree.",
                },
            )
        if room.round_state == "round_resolution":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "round_resolution_active",
                    "message": "Fin de manche en cours. Patientez avant la transition.",
                },
            )
        if payload.client_version is not None and payload.client_version != room.turn_version:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "turn_version_conflict",
                    "message": "Version de tour obsolete. Resynchronisez votre etat.",
                    "server_version": room.turn_version,
                },
            )
        participant_ids = [participant.participant_id for participant in room.participants]
        if payload.participant_id not in participant_ids:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "participant_not_in_room",
                    "message": "Participant inconnu pour cette salle.",
                },
            )
        ensure_gameplay_participant(room, payload.participant_id)
        if room.current_clue is None:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "clue_nothing_to_withdraw",
                    "message": "Aucun indice actif a retirer.",
                },
            )
        if payload.participant_id != room.current_clue_author_participant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "clue_withdraw_wrong_player",
                    "message": "Seul l'auteur peut retirer cet indice.",
                },
            )
        if room.clue_selection_touched or room.selected_card_words:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "clue_withdraw_blocked",
                    "message": "La selection a debute - l'indice ne peut plus etre retire.",
                },
            )
        clear_current_clue(room)
        room.turn_version += 1
        room_for_broadcast = room

    await broadcast_room_event(room_for_broadcast, "clue_withdrawn")
    return WithdrawClueResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        turn_version=room.turn_version,
    )


@app.post("/rooms/{room_code}/cards/toggle", response_model=ToggleCardSelectionResponse)
async def toggle_card_selection(
    room_code: str, payload: ToggleCardSelectionRequest
) -> ToggleCardSelectionResponse:
    normalized_code = room_code.strip().upper()
    normalized_card = payload.card_word.strip()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if room.phase == "game_over":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_over",
                    "message": "La partie est terminee.",
                },
            )
        if room.phase != "in_game":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_not_started",
                    "message": "La partie n'est pas encore demarree.",
                },
            )
        if room.round_state == "round_resolution":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "round_resolution_active",
                    "message": "Fin de manche en cours. Patientez avant la transition.",
                },
            )
        if payload.client_version is not None and payload.client_version != room.turn_version:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "turn_version_conflict",
                    "message": "Version de tour obsolete. Resynchronisez votre etat.",
                    "server_version": room.turn_version,
                },
            )
        participant_ids = [participant.participant_id for participant in room.participants]
        if payload.participant_id not in participant_ids:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "participant_not_in_room",
                    "message": "Participant inconnu pour cette salle.",
                },
            )
        ensure_gameplay_participant(room, payload.participant_id)
        if payload.participant_id != room.active_participant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "not_your_turn",
                    "message": "Ce n'est pas votre tour d'agir.",
                },
            )
        if not (room.active_role or "").startswith("guesser_"):
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "role_not_allowed_to_select_card",
                    "message": "Seul le devineur actif peut selectionner une carte.",
                },
            )
        if normalized_card not in room.board_cards:
            raise HTTPException(
                status_code=400,
                detail={
                    "error_code": "card_not_found",
                    "message": "Carte introuvable sur la grille courante.",
                },
            )
        if normalized_card in room.revealed_card_words:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "card_already_revealed",
                    "message": "Cette carte est deja revelee.",
                },
            )
        if room.current_clue is not None and (room.active_role or "").startswith("guesser_"):
            room.clue_selection_touched = True
        if normalized_card in room.selected_card_words:
            room.selected_card_words = [
                card_word
                for card_word in room.selected_card_words
                if card_word != normalized_card
            ]
        else:
            room.selected_card_words.append(normalized_card)
        room.turn_version += 1
        room_for_broadcast = room

    await broadcast_room_event(room_for_broadcast, "card_selection_changed")
    return ToggleCardSelectionResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        selected_card_words=room.selected_card_words,
        turn_version=room.turn_version,
    )


@app.post("/rooms/{room_code}/cards/reveal", response_model=RevealCardsResponse)
async def reveal_selected_cards(
    room_code: str, payload: RevealCardsRequest
) -> RevealCardsResponse:
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if room.phase == "game_over":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_over",
                    "message": "La partie est terminee.",
                },
            )
        if room.phase != "in_game":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_not_started",
                    "message": "La partie n'est pas encore demarree.",
                },
            )
        if room.round_state == "round_resolution":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "round_resolution_active",
                    "message": "Fin de manche en cours. Patientez avant la transition.",
                },
            )
        if payload.client_version is not None and payload.client_version != room.turn_version:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "turn_version_conflict",
                    "message": "Version de tour obsolete. Resynchronisez votre etat.",
                    "server_version": room.turn_version,
                },
            )
        participant_ids = [participant.participant_id for participant in room.participants]
        if payload.participant_id not in participant_ids:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "participant_not_in_room",
                    "message": "Participant inconnu pour cette salle.",
                },
            )
        ensure_gameplay_participant(room, payload.participant_id)
        if payload.participant_id != room.active_participant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "not_your_turn",
                    "message": "Ce n'est pas votre tour d'agir.",
                },
            )
        if not (room.active_role or "").startswith("guesser_"):
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "role_not_allowed_to_reveal",
                    "message": "Seul le devineur actif peut reveler des cartes.",
                },
            )
        if room.current_clue is None:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "clue_required_before_reveal",
                    "message": "Un indice valide est requis avant revelation.",
                },
            )
        if not room.selected_card_words:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "no_cards_selected",
                    "message": "Selectionnez au moins une carte avant revelation.",
                },
            )
        revealed_now_words = [
            card_word
            for card_word in room.selected_card_words
            if card_word not in room.revealed_card_words
        ]
        if not revealed_now_words:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "no_new_cards_to_reveal",
                    "message": "Aucune nouvelle carte a reveler.",
                },
            )
        room.revealed_card_words.extend(revealed_now_words)
        room.selected_card_words = []
        revealed_points = len(revealed_now_words)
        active_role = room.active_role or ""
        if active_role == "guesser_team_a":
            room.team_a_score += revealed_points
        elif active_role == "guesser_team_b":
            room.team_b_score += revealed_points

        crossed_finish_line = (
            room.team_a_score >= GAME_SCORE_TARGET or room.team_b_score >= GAME_SCORE_TARGET
        )
        if crossed_finish_line:
            room.phase = "game_over"
            if room.team_a_score > room.team_b_score:
                room.winning_team_key = "team_a"
            elif room.team_b_score > room.team_a_score:
                room.winning_team_key = "team_b"
            else:
                room.winning_team_key = "tie"
            winner_fr = (
                "Victoire de l'equipe A."
                if room.winning_team_key == "team_a"
                else (
                    "Victoire de l'equipe B."
                    if room.winning_team_key == "team_b"
                    else "Match nul — scores egaux."
                )
            )
            room.game_end_message = (
                f"{winner_fr} Scores finaux : Equipe A {room.team_a_score}, "
                f"Equipe B {room.team_b_score} (objectif {GAME_SCORE_TARGET})."
            )
            room.round_state = "playing"
            room.round_result_message = None
            room.round_resolution_started_at_ms = None
        elif len(room.revealed_card_words) >= ROUND_END_REVEAL_THRESHOLD:
            room.round_state = "round_resolution"
            room.round_result_message = (
                f"Manche {room.round_number}: {len(room.revealed_card_words)} carte(s) revelee(s)."
            )
            room.round_resolution_started_at_ms = int(time.time() * 1000)
        room.current_clue_author_participant_id = None
        room.turn_version += 1
        room_for_broadcast = room

    await broadcast_room_event(room_for_broadcast, "cards_revealed")
    if room_for_broadcast.phase == "game_over":
        await broadcast_room_event(room_for_broadcast, "game_finished")
    elif room_for_broadcast.round_state == "round_resolution":
        await broadcast_room_event(room_for_broadcast, "round_resolution_started")
    return RevealCardsResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        revealed_card_words=room.revealed_card_words,
        revealed_now_words=revealed_now_words,
        turn_version=room.turn_version,
        round_state=room.round_state,
        round_result_message=room.round_result_message,
        round_resolution_started_at_ms=room.round_resolution_started_at_ms,
        round_resolution_beat_ms=ROUND_RESOLUTION_BEAT_MS,
        round_number=room.round_number,
        next_step_hint="next_round" if room.round_state == "round_resolution" else None,
        phase=room.phase,
        team_a_score=room.team_a_score,
        team_b_score=room.team_b_score,
        game_score_target=GAME_SCORE_TARGET,
        winning_team_key=room.winning_team_key,
        game_end_message=room.game_end_message,
    )


@app.post("/rooms/{room_code}/round/continue", response_model=ContinueRoundResponse)
async def continue_round(
    room_code: str, payload: ContinueRoundRequest
) -> ContinueRoundResponse:
    normalized_code = room_code.strip().upper()
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if room.phase == "game_over":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_over",
                    "message": "La partie est terminee.",
                },
            )
        if room.phase != "in_game":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "game_not_started",
                    "message": "La partie n'est pas encore demarree.",
                },
            )
        if room.round_state != "round_resolution":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "round_resolution_not_active",
                    "message": "Aucune fin de manche a confirmer.",
                },
            )
        if is_round_resolution_active(room):
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "round_resolution_beat_not_elapsed",
                    "message": "Le beat de fin de manche n'est pas termine.",
                },
            )
        if payload.client_version is not None and payload.client_version != room.turn_version:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "turn_version_conflict",
                    "message": "Version de tour obsolete. Resynchronisez votre etat.",
                    "server_version": room.turn_version,
                },
            )
        participant_ids_continue = [
            participant.participant_id for participant in room.participants
        ]
        if payload.participant_id not in participant_ids_continue:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "participant_not_in_room",
                    "message": "Participant inconnu pour cette salle.",
                },
            )
        ensure_gameplay_participant(room, payload.participant_id)
        if payload.participant_id != room.host_participant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "only_host_can_continue_round",
                    "message": "Seul l'hote peut lancer la manche suivante.",
                },
            )
        room.round_number += 1
        room.round_state = "playing"
        room.round_result_message = None
        room.round_resolution_started_at_ms = None
        clear_current_clue(room)
        room.selected_card_words = []
        room.revealed_card_words = []
        gameplay_continue_ids = [
            participant.participant_id
            for participant in room.participants
            if participant.participant_id in room.participant_roles
        ]
        if gameplay_continue_ids:
            room.active_participant_id = gameplay_continue_ids[0]
            room.active_role = room.participant_roles.get(room.active_participant_id)
        room.turn_version += 1
        room_for_broadcast = room

    await broadcast_room_event(room_for_broadcast, "round_resolution_cleared")
    return ContinueRoundResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        round_number=room.round_number,
        turn_version=room.turn_version,
        active_participant_id=room.active_participant_id,
        active_role=room.active_role,
    )


@app.post("/rooms/{room_code}/mega-deck", response_model=MegaDeckResponse)
async def add_mega_deck_word(room_code: str, payload: AddMegaDeckWordRequest) -> MegaDeckResponse:
    normalized_code = room_code.strip().upper()
    normalized_word = payload.word.strip()
    if len(normalized_word) < 2:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "word_invalid",
                "message": "Le mot doit contenir au moins 2 caracteres.",
            },
        )
    with rooms_lock:
        room = rooms_by_code.get(normalized_code)
        if room is None:
            raise HTTPException(
                status_code=404,
                detail={
                    "error_code": "room_not_found",
                    "message": "Code de salle invalide ou salle indisponible.",
                },
            )
        if room.phase != "pre_game":
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "mega_deck_locked",
                    "message": "Le mega-deck est verrouille apres demarrage.",
                },
            )
        lowered = {word.lower() for word in room.mega_deck}
        if normalized_word.lower() in lowered:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "word_duplicate",
                    "message": "Ce mot est deja present dans le mega-deck.",
                },
            )
        if len(room.mega_deck) >= MAX_MEGA_DECK_WORDS:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "mega_deck_limit_reached",
                    "message": f"Limite atteinte ({MAX_MEGA_DECK_WORDS} mots max).",
                },
            )
        room.mega_deck.append(normalized_word)
        words = list(room.mega_deck)

    return MegaDeckResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        words=words,
        max_words=MAX_MEGA_DECK_WORDS,
    )
