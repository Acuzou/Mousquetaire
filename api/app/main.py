from __future__ import annotations

import secrets
from dataclasses import dataclass
from threading import Lock
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Response
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


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@dataclass
class Room:
    room_id: str
    room_code: str
    participants: list["Participant"]
    mega_deck: list[str]


@dataclass
class Participant:
    participant_id: str
    pseudo: str


class CreateRoomResponse(BaseModel):
    room_id: str
    room_code: str


class JoinRoomRequest(BaseModel):
    room_code: str = Field(min_length=6, max_length=6)
    pseudo: str = Field(min_length=2, max_length=24)


class JoinRoomResponse(BaseModel):
    room_id: str
    room_code: str
    participant_id: str
    pseudo: str


class AddMegaDeckWordRequest(BaseModel):
    word: str = Field(min_length=1, max_length=32)


class MegaDeckResponse(BaseModel):
    room_id: str
    room_code: str
    words: list[str]
    max_words: int


rooms_by_code: dict[str, Room] = {}
rooms_lock = Lock()
MAX_PLAYERS_PER_ROOM = 8
ROOM_CODE_LENGTH = 6
MAX_MEGA_DECK_WORDS = 25


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
                )
                rooms_by_code[room_code] = room
                return room
    raise RuntimeError("failed_to_allocate_unique_room_code")


@app.post("/rooms", response_model=CreateRoomResponse, status_code=201)
async def create_room_endpoint() -> CreateRoomResponse:
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
    return CreateRoomResponse(room_id=room.room_id, room_code=room.room_code)


@app.post("/rooms/join", response_model=JoinRoomResponse)
async def join_room_endpoint(payload: JoinRoomRequest, response: Response) -> JoinRoomResponse:
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
        if len(room.participants) >= MAX_PLAYERS_PER_ROOM:
            raise HTTPException(
                status_code=409,
                detail={
                    "error_code": "room_full",
                    "message": f"Salle complete ({MAX_PLAYERS_PER_ROOM} joueurs max).",
                },
            )
        participant = Participant(participant_id=str(uuid4()), pseudo=pseudo)
        room.participants.append(participant)

    session_token = secrets.token_urlsafe(24)
    response.set_cookie(
        key="mousquetaire_session",
        value=session_token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 8,
    )
    return JoinRoomResponse(
        room_id=room.room_id,
        room_code=room.room_code,
        participant_id=participant.participant_id,
        pseudo=participant.pseudo,
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
