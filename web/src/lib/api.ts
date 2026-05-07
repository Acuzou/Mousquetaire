export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type CreateRoomResponse = {
  room_id: string;
  room_code: string;
};

export type JoinRoomResponse = {
  room_id: string;
  room_code: string;
  participant_id: string;
  pseudo: string;
};

export type MegaDeckResponse = {
  room_id: string;
  room_code: string;
  words: string[];
  max_words: number;
};

export async function fetchHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}

export async function createRoom(): Promise<CreateRoomResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/rooms`, {
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
  if (!payload.room_id || !payload.room_code) {
    throw new Error("Reponse serveur invalide lors de la creation de salle.");
  }

  return {
    room_id: payload.room_id,
    room_code: payload.room_code,
  };
}

export async function joinRoom(params: {
  roomCode: string;
  pseudo: string;
}): Promise<JoinRoomResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/rooms/join`, {
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
  if (!payload.room_id || !payload.room_code || !payload.participant_id || !payload.pseudo) {
    throw new Error("Reponse serveur invalide lors de la tentative de jointure.");
  }

  return {
    room_id: payload.room_id,
    room_code: payload.room_code,
    participant_id: payload.participant_id,
    pseudo: payload.pseudo,
  };
}

export async function addMegaDeckWord(params: {
  roomCode: string;
  word: string;
}): Promise<MegaDeckResponse> {
  let response: Response;
  try {
    response = await fetch(
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
    response = await fetch(`${API_BASE_URL}/rooms/${roomCode.trim().toUpperCase()}/mega-deck`, {
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
