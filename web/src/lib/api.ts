import { throwIfApiFailed } from "./apiErrors";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const CORRELATION_HEADER = "X-Correlation-ID";

function newCorrelationId(): string {
  return crypto.randomUUID();
}

/** Fetch JSON API avec en-tete X-Correlation-ID (trace support / FR30). */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has(CORRELATION_HEADER)) {
    headers.set(CORRELATION_HEADER, newCorrelationId());
  }
  const { credentials: creds, ...rest } = init ?? {};
  return fetch(input, {
    ...rest,
    headers,
    credentials: creds ?? "include",
  });
}

export type CreateRoomResponse = {
  room_id: string;
  room_code: string;
  diagnostic_ref: string;
};

export type JoinRoomResponse = {
  room_id: string;
  room_code: string;
  participant_id: string;
  pseudo: string;
  is_host: boolean;
  player_status: string;
  room_phase: string;
  status_message: string;
  session_resumed: boolean;
  diagnostic_ref: string;
};

export type MegaDeckResponse = {
  room_id: string;
  room_code: string;
  words: string[];
  max_words: number;
};

export type RoomParticipant = {
  participant_id: string;
  pseudo: string;
};

export type RoomStateResponse = {
  room_id: string;
  room_code: string;
  phase: string;
  variant_key: string;
  teams_count: number;
  grid_size: number;
  black_words: number;
  participant_roles: Record<string, string>;
  turn_version: number;
  active_participant_id: string | null;
  active_role: string | null;
  current_clue: string | null;
  board_cards: string[];
  selected_card_words: string[];
  revealed_card_words: string[];
  round_state: string;
  round_result_message: string | null;
  round_resolution_started_at_ms: number | null;
  round_resolution_beat_ms: number;
  round_number: number;
  next_step_hint: string | null;
  team_a_score: number;
  team_b_score: number;
  game_score_target: number;
  winning_team_key: string | null;
  game_end_message: string | null;
  current_clue_author_participant_id: string | null;
  clue_withdraw_allowed: boolean;
  participants: RoomParticipant[];
  can_start: boolean;
  blocked_reasons: string[];
  host_participant_id: string | null;
  host_absence_grace_until_ms: number | null;
};

export async function fetchHealth(): Promise<{ status: string }> {
  const response = await apiFetch(`${API_BASE_URL}/health`, {
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

export async function createRoom(): Promise<CreateRoomResponse> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/rooms`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new Error(
      "Impossible de creer la salle pour le moment. Verifiez votre connexion.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: { message?: string } }
      | null;
    throw new Error(
      payload?.detail?.message ?? "Impossible de creer la salle pour le moment.",
    );
  }

  const payload = (await response.json()) as Partial<CreateRoomResponse>;
  if (!payload.room_id || !payload.room_code || !payload.diagnostic_ref) {
    throw new Error("Reponse serveur invalide lors de la creation de salle.");
  }

  return {
    room_id: payload.room_id,
    room_code: payload.room_code,
    diagnostic_ref: payload.diagnostic_ref,
  };
}

export async function joinRoom(params: {
  roomCode: string;
  pseudo: string;
}): Promise<JoinRoomResponse> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/rooms/join`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_code: params.roomCode.trim().toUpperCase(),
        pseudo: params.pseudo.trim(),
      }),
    });
  } catch {
    throw new Error(
      "Impossible de rejoindre la salle pour le moment. Verifiez votre connexion.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: { message?: string } | Array<{ msg?: string }> }
      | null;
    const detail = payload?.detail;
    const detailArrayMessage =
      Array.isArray(detail) && detail[0]?.msg
        ? "Code de salle ou pseudo invalide."
        : null;
    throw new Error(
      detailArrayMessage ??
        (typeof detail === "object" && !Array.isArray(detail) ? detail?.message : undefined) ??
        "Impossible de rejoindre la salle pour le moment.",
    );
  }

  const payload = (await response.json()) as Partial<JoinRoomResponse>;
  if (
    !payload.room_id ||
    !payload.room_code ||
    !payload.participant_id ||
    !payload.pseudo ||
    payload.is_host === undefined ||
    payload.player_status === undefined ||
    payload.room_phase === undefined ||
    payload.status_message === undefined ||
    payload.session_resumed === undefined ||
    !payload.diagnostic_ref
  ) {
    throw new Error("Reponse serveur invalide lors de la tentative de jointure.");
  }

  return {
    room_id: payload.room_id,
    room_code: payload.room_code,
    participant_id: payload.participant_id,
    pseudo: payload.pseudo,
    is_host: payload.is_host,
    player_status: payload.player_status,
    room_phase: payload.room_phase,
    status_message: payload.status_message,
    session_resumed: payload.session_resumed,
    diagnostic_ref: payload.diagnostic_ref,
  };
}

export async function addMegaDeckWord(params: {
  roomCode: string;
  word: string;
}): Promise<MegaDeckResponse> {
  let response: Response;
  try {
    response = await apiFetch(
      `${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/mega-deck`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: params.word.trim() }),
      },
    );
  } catch {
    throw new Error(
      "Impossible d'ajouter ce mot pour le moment. Verifiez votre connexion.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: { message?: string } }
      | null;
    throw new Error(payload?.detail?.message ?? "Impossible d'ajouter ce mot.");
  }

  const payload = (await response.json()) as Partial<MegaDeckResponse>;
  if (
    !payload.room_code ||
    !payload.room_id ||
    !payload.words ||
    payload.max_words === undefined
  ) {
    throw new Error("Reponse serveur invalide pour le mega-deck.");
  }
  return {
    room_id: payload.room_id,
    room_code: payload.room_code,
    words: payload.words,
    max_words: payload.max_words,
  };
}

export async function fetchMegaDeck(roomCode: string): Promise<MegaDeckResponse> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/rooms/${roomCode.trim().toUpperCase()}/mega-deck`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error(
      "Impossible de charger le mega-deck pour le moment. Verifiez votre connexion.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: { message?: string } }
      | null;
    throw new Error(payload?.detail?.message ?? "Impossible de charger le mega-deck.");
  }

  const payload = (await response.json()) as Partial<MegaDeckResponse>;
  if (
    !payload.room_code ||
    !payload.room_id ||
    !payload.words ||
    payload.max_words === undefined
  ) {
    throw new Error("Reponse serveur invalide pour le mega-deck.");
  }
  return {
    room_id: payload.room_id,
    room_code: payload.room_code,
    words: payload.words,
    max_words: payload.max_words,
  };
}

export async function fetchRoomState(roomCode: string): Promise<RoomStateResponse> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/rooms/${roomCode.trim().toUpperCase()}/state`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new Error(
      "Impossible de charger l'etat de la salle pour le moment. Verifiez votre connexion.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: { message?: string } }
      | null;
    throw new Error(payload?.detail?.message ?? "Impossible de charger l'etat de la salle.");
  }

  const payload = (await response.json()) as Partial<RoomStateResponse>;
  if (
    !payload.room_id ||
    !payload.room_code ||
    !payload.phase ||
    !payload.variant_key ||
    payload.teams_count === undefined ||
    payload.grid_size === undefined ||
    payload.black_words === undefined ||
    !payload.participant_roles ||
    payload.turn_version === undefined ||
    payload.current_clue === undefined ||
    !Array.isArray(payload.board_cards) ||
    !Array.isArray(payload.selected_card_words) ||
    !Array.isArray(payload.blocked_reasons) ||
    payload.can_start === undefined ||
    !payload.blocked_reasons ||
    !(
      typeof payload.host_participant_id === "string" || payload.host_participant_id === null
    ) ||
    !(
      typeof payload.host_absence_grace_until_ms === "number" ||
      payload.host_absence_grace_until_ms === null
    )
  ) {
    throw new Error("Reponse serveur invalide pour l'etat de salle.");
  }

  return {
    room_id: payload.room_id,
    room_code: payload.room_code,
    phase: payload.phase,
    variant_key: payload.variant_key,
    teams_count: payload.teams_count,
    grid_size: payload.grid_size,
    black_words: payload.black_words,
    participant_roles: payload.participant_roles,
    turn_version: payload.turn_version,
    active_participant_id: payload.active_participant_id ?? null,
    active_role: payload.active_role ?? null,
    current_clue: payload.current_clue ?? null,
    board_cards: payload.board_cards,
    selected_card_words: payload.selected_card_words,
    revealed_card_words: Array.isArray(payload.revealed_card_words)
      ? payload.revealed_card_words
      : [],
    round_state: payload.round_state ?? "playing",
    round_result_message: payload.round_result_message ?? null,
    round_resolution_started_at_ms: payload.round_resolution_started_at_ms ?? null,
    round_resolution_beat_ms: payload.round_resolution_beat_ms ?? 3000,
    round_number: payload.round_number ?? 1,
    next_step_hint: payload.next_step_hint ?? null,
    team_a_score: typeof payload.team_a_score === "number" ? payload.team_a_score : 0,
    team_b_score: typeof payload.team_b_score === "number" ? payload.team_b_score : 0,
    game_score_target: typeof payload.game_score_target === "number" ? payload.game_score_target : 8,
    winning_team_key:
      typeof payload.winning_team_key === "string" || payload.winning_team_key === null
        ? payload.winning_team_key
        : null,
    game_end_message:
      typeof payload.game_end_message === "string" || payload.game_end_message === null
        ? payload.game_end_message
        : null,
    current_clue_author_participant_id:
      typeof payload.current_clue_author_participant_id === "string" ||
      payload.current_clue_author_participant_id === null
        ? payload.current_clue_author_participant_id
        : null,
    clue_withdraw_allowed: Boolean(payload.clue_withdraw_allowed),
    participants: Array.isArray(payload.participants)
      ? (payload.participants as RoomParticipant[])
      : [],
    can_start: payload.can_start,
    blocked_reasons: payload.blocked_reasons,
    host_participant_id: payload.host_participant_id,
    host_absence_grace_until_ms: payload.host_absence_grace_until_ms,
  };
}

export async function startGame(params: {
  roomCode: string;
  participantId: string;
}): Promise<{
  phase: string;
  variant_key: string;
  teams_count: number;
  grid_size: number;
  black_words: number;
  participant_roles: Record<string, string>;
  turn_version: number;
  active_participant_id: string | null;
  active_role: string | null;
}> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/start`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ participant_id: params.participantId }),
    });
  } catch {
    throw new Error("Impossible de demarrer la partie pour le moment. Verifiez votre connexion.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: { message?: string } }
      | null;
    throw new Error(payload?.detail?.message ?? "Impossible de demarrer la partie.");
  }

  const payload = (await response.json()) as Partial<{
    phase: string;
    variant_key: string;
    teams_count: number;
    grid_size: number;
    black_words: number;
    participant_roles: Record<string, string>;
    turn_version: number;
    active_participant_id: string | null;
    active_role: string | null;
  }>;
  if (
    !payload.phase ||
    !payload.variant_key ||
    payload.teams_count === undefined ||
    payload.grid_size === undefined ||
    payload.black_words === undefined ||
    !payload.participant_roles ||
    payload.turn_version === undefined
  ) {
    throw new Error("Reponse serveur invalide lors du demarrage.");
  }
  return {
    phase: payload.phase,
    variant_key: payload.variant_key,
    teams_count: payload.teams_count,
    grid_size: payload.grid_size,
    black_words: payload.black_words,
    participant_roles: payload.participant_roles,
    turn_version: payload.turn_version,
    active_participant_id: payload.active_participant_id ?? null,
    active_role: payload.active_role ?? null,
  };
}

export async function advanceTurn(params: {
  roomCode: string;
  participantId: string;
  clientVersion: number;
}): Promise<{
  turn_version: number;
  active_participant_id: string;
  active_role: string;
}> {
  let response: Response;
  try {
    response = await apiFetch(
      `${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/turn/next`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: params.participantId,
          client_version: params.clientVersion,
        }),
      },
    );
  } catch {
    throw new Error("Impossible d'avancer le tour pour le moment. Verifiez votre connexion.");
  }
  await throwIfApiFailed(response, "Impossible d'avancer le tour.");
  const payload = (await response.json()) as Partial<{
    turn_version: number;
    active_participant_id: string;
    active_role: string;
  }>;
  if (!payload.turn_version || !payload.active_participant_id || !payload.active_role) {
    throw new Error("Reponse serveur invalide lors du changement de tour.");
  }
  return {
    turn_version: payload.turn_version,
    active_participant_id: payload.active_participant_id,
    active_role: payload.active_role,
  };
}

export async function submitClue(params: {
  roomCode: string;
  participantId: string;
  clueText: string;
}): Promise<{ clue_text: string; clue_giver_participant_id: string; turn_version: number }> {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/clue`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        participant_id: params.participantId,
        clue_text: params.clueText.trim(),
      }),
    });
  } catch {
    throw new Error("Impossible de valider l'indice pour le moment. Verifiez votre connexion.");
  }
  await throwIfApiFailed(response, "Impossible de valider l'indice.");
  const payload = (await response.json()) as Partial<{
    clue_text: string;
    clue_giver_participant_id: string;
    turn_version: number;
  }>;
  if (!payload.clue_text || !payload.clue_giver_participant_id || payload.turn_version === undefined) {
    throw new Error("Reponse serveur invalide lors de la validation de l'indice.");
  }
  return {
    clue_text: payload.clue_text,
    clue_giver_participant_id: payload.clue_giver_participant_id,
    turn_version: payload.turn_version,
  };
}

export async function withdrawClue(params: {
  roomCode: string;
  participantId: string;
  clientVersion: number;
}): Promise<{ turn_version: number }> {
  let response: Response;
  try {
    response = await apiFetch(
      `${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/clue/withdraw`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: params.participantId,
          client_version: params.clientVersion,
        }),
      },
    );
  } catch {
    throw new Error(
      "Impossible de retirer l'indice pour le moment. Verifiez votre connexion.",
    );
  }
  await throwIfApiFailed(response, "Impossible de retirer l'indice.");
  const payload = (await response.json()) as Partial<{ turn_version: number }>;
  if (payload.turn_version === undefined) {
    throw new Error("Reponse serveur invalide lors du retrait d'indice.");
  }
  return { turn_version: payload.turn_version };
}

export async function toggleCardSelection(params: {
  roomCode: string;
  participantId: string;
  cardWord: string;
  clientVersion: number;
}): Promise<{ selected_card_words: string[]; turn_version: number }> {
  let response: Response;
  try {
    response = await apiFetch(
      `${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/cards/toggle`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: params.participantId,
          card_word: params.cardWord,
          client_version: params.clientVersion,
        }),
      },
    );
  } catch {
    throw new Error(
      "Impossible de selectionner cette carte pour le moment. Verifiez votre connexion.",
    );
  }
  await throwIfApiFailed(response, "Impossible de selectionner cette carte.");
  const payload = (await response.json()) as Partial<{
    selected_card_words: string[];
    turn_version: number;
  }>;
  if (!payload.selected_card_words || payload.turn_version === undefined) {
    throw new Error("Reponse serveur invalide lors de la selection de carte.");
  }
  return {
    selected_card_words: payload.selected_card_words,
    turn_version: payload.turn_version,
  };
}

export async function revealSelectedCards(params: {
  roomCode: string;
  participantId: string;
  clientVersion: number;
}): Promise<{
  revealed_card_words: string[];
  revealed_now_words: string[];
  turn_version: number;
  round_state: string;
  round_result_message: string | null;
  round_resolution_started_at_ms: number | null;
  round_resolution_beat_ms: number;
  round_number: number;
  next_step_hint: string | null;
  phase: string;
  team_a_score: number;
  team_b_score: number;
  game_score_target: number;
  winning_team_key: string | null;
  game_end_message: string | null;
}> {
  let response: Response;
  try {
    response = await apiFetch(
      `${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/cards/reveal`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: params.participantId,
          client_version: params.clientVersion,
        }),
      },
    );
  } catch {
    throw new Error(
      "Impossible de reveler les cartes pour le moment. Verifiez votre connexion.",
    );
  }
  await throwIfApiFailed(response, "Impossible de reveler les cartes.");
  const payload = (await response.json()) as Partial<{
    revealed_card_words: string[];
    revealed_now_words: string[];
    turn_version: number;
    round_state: string;
    round_result_message: string | null;
    round_resolution_started_at_ms: number | null;
    round_resolution_beat_ms: number;
    round_number: number;
    next_step_hint: string | null;
    phase: string;
    team_a_score: number;
    team_b_score: number;
    game_score_target: number;
    winning_team_key: string | null;
    game_end_message: string | null;
  }>;
  if (
    !Array.isArray(payload.revealed_card_words) ||
    !Array.isArray(payload.revealed_now_words) ||
    payload.turn_version === undefined
  ) {
    throw new Error("Reponse serveur invalide lors de la revelation.");
  }
  return {
    revealed_card_words: payload.revealed_card_words,
    revealed_now_words: payload.revealed_now_words,
    turn_version: payload.turn_version,
    round_state: payload.round_state ?? "playing",
    round_result_message: payload.round_result_message ?? null,
    round_resolution_started_at_ms: payload.round_resolution_started_at_ms ?? null,
    round_resolution_beat_ms: payload.round_resolution_beat_ms ?? 3000,
    round_number: payload.round_number ?? 1,
    next_step_hint: payload.next_step_hint ?? null,
    phase: payload.phase ?? "in_game",
    team_a_score: typeof payload.team_a_score === "number" ? payload.team_a_score : 0,
    team_b_score: typeof payload.team_b_score === "number" ? payload.team_b_score : 0,
    game_score_target: typeof payload.game_score_target === "number" ? payload.game_score_target : 8,
    winning_team_key:
      typeof payload.winning_team_key === "string" || payload.winning_team_key === null
        ? payload.winning_team_key
        : null,
    game_end_message:
      typeof payload.game_end_message === "string" || payload.game_end_message === null
        ? payload.game_end_message
        : null,
  };
}

export async function continueRound(params: {
  roomCode: string;
  participantId: string;
  clientVersion: number;
}): Promise<{
  round_number: number;
  turn_version: number;
  active_participant_id: string | null;
  active_role: string | null;
}> {
  let response: Response;
  try {
    response = await apiFetch(
      `${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/round/continue`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participant_id: params.participantId,
          client_version: params.clientVersion,
        }),
      },
    );
  } catch {
    throw new Error(
      "Impossible de lancer la manche suivante pour le moment. Verifiez votre connexion.",
    );
  }
  await throwIfApiFailed(response, "Impossible de lancer la manche suivante.");
  const payload = (await response.json()) as Partial<{
    round_number: number;
    turn_version: number;
    active_participant_id: string | null;
    active_role: string | null;
  }>;
  if (payload.round_number === undefined || payload.turn_version === undefined) {
    throw new Error("Reponse serveur invalide lors de la transition de manche.");
  }
  return {
    round_number: payload.round_number,
    turn_version: payload.turn_version,
    active_participant_id: payload.active_participant_id ?? null,
    active_role: payload.active_role ?? null,
  };
}

export async function leaveRoom(params: {
  roomCode: string;
  participantId: string;
}): Promise<{
  phase: string;
  turn_version: number;
  participants_remaining: number;
}> {
  let response: Response;
  try {
    response = await apiFetch(
      `${API_BASE_URL}/rooms/${params.roomCode.trim().toUpperCase()}/leave`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participant_id: params.participantId }),
      },
    );
  } catch {
    throw new Error(
      "Impossible de quitter la salle pour le moment. Verifiez votre connexion.",
    );
  }
  await throwIfApiFailed(response, "Impossible de quitter la salle.");
  const payload = (await response.json()) as Partial<{
    phase: string;
    turn_version: number;
    participants_remaining: number;
  }>;
  if (
    payload.phase === undefined ||
    payload.turn_version === undefined ||
    payload.participants_remaining === undefined
  ) {
    throw new Error("Reponse serveur invalide lors de la sortie de salle.");
  }
  return {
    phase: payload.phase,
    turn_version: payload.turn_version,
    participants_remaining: payload.participants_remaining,
  };
}
