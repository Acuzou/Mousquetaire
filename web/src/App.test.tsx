import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { MAX_PLAYERS_PER_ROOM, ROOM_CODE_LENGTH } from "./lib/gameLimits";
import App from "./App";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

function setUserAgent(value: string): void {
  Object.defineProperty(window.navigator, "userAgent", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  setUserAgent(DEFAULT_USER_AGENT);
});

describe("App", () => {
  it("shows non-blocking warning when browser is outside V1 matrix", () => {
    setUserAgent("UnknownBrowser/1.0");
    render(<App />);

    expect(
      screen.getByText(/Votre navigateur est hors matrice V1/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "matrice navigateurs V1" }),
    ).toHaveAttribute("href", "https://example.com/mousquetaire/matrice-navigateurs-v1");

    fireEvent.click(screen.getByRole("button", { name: "Essayer quand meme" }));
    expect(screen.queryByText(/Votre navigateur est hors matrice V1/)).not.toBeInTheDocument();
  });

  it("creates a room and displays the code", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            diagnostic_ref: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "pre_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: {},
            turn_version: 0,
            active_participant_id: null,
            active_role: null,
            current_clue: null,
            board_cards: [],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 0,
            team_b_score: 0,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["Il faut au moins 2 joueurs pour demarrer."],
            host_participant_id: null,
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Creer une salle" }));

    await waitFor(() =>
      expect(screen.getByText(/Code de salle:/)).toBeInTheDocument(),
    );
    expect(screen.getByText("AB12CD")).toBeInTheDocument();
  });

  it("shows readable error when room creation fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: { message: "Impossible de creer la salle pour le moment. Reessayez." },
      }),
    } as Response);

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Creer une salle" }));

    await waitFor(() =>
      expect(
        screen.getByText("Impossible de creer la salle pour le moment. Reessayez."),
      ).toBeInTheDocument(),
    );
  });

  it("shows readable error on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Creer une salle" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Impossible de creer la salle pour le moment. Verifiez votre connexion.",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("joins an existing room with code and pseudo", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: ["Ananas"],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "pre_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: {},
            turn_version: 0,
            active_participant_id: null,
            active_role: null,
            current_clue: null,
            board_cards: [],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 0,
            team_b_score: 0,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["Le mega-deck doit etre complet (25 mots requis)."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() =>
      expect(
        screen.getByText("Pseudo Alex rejoint la salle AB12CD. Session active."),
      ).toBeInTheDocument(),
    );
  });

  it("shows explicit message when joining with invalid room code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: { message: "Code de salle invalide ou salle indisponible." },
      }),
    } as Response);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "XXXXXX" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() =>
      expect(
        screen.getByText("Code de salle invalide ou salle indisponible."),
      ).toBeInTheDocument(),
    );
  });

  it("shows explicit message when room capacity is exceeded", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: { message: `Salle complete (${MAX_PLAYERS_PER_ROOM} joueurs max).` },
      }),
    } as Response);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ABC123" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() =>
      expect(
        screen.getByText(`Salle complete (${MAX_PLAYERS_PER_ROOM} joueurs max).`),
      ).toBeInTheDocument(),
    );
  });

  it("adds a word to mega-deck and renders updated list", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room_id: "room-1",
          room_code: "AB12CD",
          diagnostic_ref: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room_id: "room-1",
          room_code: "AB12CD",
          phase: "pre_game",
          variant_key: "mousquetaire_p0",
          teams_count: 2,
          grid_size: 5,
          black_words: 1,
          participant_roles: {},
          turn_version: 0,
          active_participant_id: null,
          active_role: null,
          current_clue: null,
          board_cards: [],
          selected_card_words: [],
          revealed_card_words: [],
          round_state: "playing",
          round_result_message: null,
          round_resolution_started_at_ms: null,
          round_resolution_beat_ms: 3000,
          round_number: 1,
          next_step_hint: null,
          team_a_score: 0,
          team_b_score: 0,
          game_score_target: 8,
          winning_team_key: null,
          game_end_message: null,
          current_clue_author_participant_id: null,
          clue_withdraw_allowed: false,
          participants: [],
          can_start: false,
          blocked_reasons: ["Le mega-deck doit etre complet (25 mots requis)."],
          host_participant_id: null,
          host_absence_grace_until_ms: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room_id: "room-1",
          room_code: "AB12CD",
          words: [],
          max_words: 25,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room_id: "room-1",
          room_code: "AB12CD",
          words: ["Ananas"],
          max_words: 25,
        }),
      } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Creer une salle" }));
    await waitFor(() => expect(screen.getByText("AB12CD")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Mot a ajouter"), {
      target: { value: "Ananas" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au mega-deck" }));

    await waitFor(() => expect(screen.getByText("Ananas")).toBeInTheDocument());
    expect(screen.getByText(/1\/25/)).toBeInTheDocument();
  });

  it("shows explicit message when mega-deck limit is reached", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room_id: "room-1",
          room_code: "AB12CD",
          diagnostic_ref: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room_id: "room-1",
          room_code: "AB12CD",
          words: [],
          max_words: 25,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room_id: "room-1",
          room_code: "AB12CD",
          phase: "pre_game",
          variant_key: "mousquetaire_p0",
          teams_count: 2,
          grid_size: 5,
          black_words: 1,
          participant_roles: {},
          turn_version: 0,
          active_participant_id: null,
          active_role: null,
          current_clue: null,
          board_cards: [],
          selected_card_words: [],
          revealed_card_words: [],
          round_state: "playing",
          round_result_message: null,
          round_resolution_started_at_ms: null,
          round_resolution_beat_ms: 3000,
          round_number: 1,
          next_step_hint: null,
          team_a_score: 0,
          team_b_score: 0,
          game_score_target: 8,
          winning_team_key: null,
          game_end_message: null,
          current_clue_author_participant_id: null,
          clue_withdraw_allowed: false,
          participants: [],
          can_start: false,
          blocked_reasons: ["Le mega-deck doit etre complet (25 mots requis)."],
          host_participant_id: null,
          host_absence_grace_until_ms: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          detail: { message: "Limite atteinte (25 mots max)." },
        }),
      } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Creer une salle" }));
    await waitFor(() => expect(screen.getByText("AB12CD")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Mot a ajouter"), {
      target: { value: "Overflow" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter au mega-deck" }));

    await waitFor(() =>
      expect(screen.getByText("Limite atteinte (25 mots max).")).toBeInTheDocument(),
    );
  });

  it("renders legal footer links and CGU risks content in French", () => {
    render(<App />);

    const cguLink = screen.getByRole("link", { name: "CGU" });
    const riskLink = screen.getByRole("link", { name: "Risques contenu" });
    const footerNav = screen.getByLabelText("Liens legaux");
    const transparencyFooterLink = within(footerNav).getByRole("link", {
      name: "Transparence IA",
    });
    const assistTransparencyLink = screen.getByRole("link", {
      name: /Transparence — usage de l'IA \(lien depuis le panneau assist\)/,
    });
    const aboutLink = screen.getByRole("link", { name: "A propos" });
    const persistenceLink = screen.getByRole("link", { name: "Persistance V1" });

    expect(cguLink).toHaveAttribute("href", "#cgu");
    expect(riskLink).toHaveAttribute("href", "#risques-contenu");
    expect(transparencyFooterLink).toHaveAttribute("href", "#transparence-ia");
    expect(assistTransparencyLink).toHaveAttribute("href", "#transparence-ia");
    expect(aboutLink).toHaveAttribute("href", "#a-propos");
    expect(persistenceLink).toHaveAttribute("href", "#persistance-v1");
    expect(
      screen.getByText("Conditions generales d'utilisation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aucun filtre automatique n'est applique sur les mots des joueurs en V1/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Transparence.*usage de l'IA/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Les fonctions d'assist IA sont/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Regles V1: code de salle alphanumerique sur ${ROOM_CODE_LENGTH} caracteres, capacite max ${MAX_PLAYERS_PER_ROOM} joueurs.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Version du build:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Notes: socle MVP multijoueur, legal et jointure de salle/),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Version du build: \d+\.\d+\.\d+/)).toBeInTheDocument();
    expect(
      screen.getByText(/Aucun compte email\/mot de passe n'est requis pour creer ou rejoindre une salle en V1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Les parties ne sont pas sauvegardees entre sessions: les donnees de jeu sont volatiles/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exception possible: quelques preferences locales non critiques peuvent rester dans le navigateur/),
    ).toBeInTheDocument();

    cguLink.focus();
    expect(cguLink).toHaveFocus();
    const roomCodeInput = screen.getByLabelText("Code de salle");
    roomCodeInput.focus();
    expect(roomCodeInput).toHaveFocus();
    const joinButton = screen.getByRole("button", { name: "Rejoindre la salle" });
    joinButton.focus();
    expect(joinButton).toHaveFocus();
  });

  it("shows disabled start action with explicit reason for host", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "pre_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: {},
            turn_version: 0,
            active_participant_id: null,
            active_role: null,
            current_clue: null,
            board_cards: [],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 0,
            team_b_score: 0,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["Le mega-deck doit etre complet (25 mots requis)."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() =>
      expect(screen.getByText(/Demarrage bloque: Le mega-deck doit etre complet/)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Demarrer la partie" })).toBeDisabled();
    expect(screen.getByText(/Variante active: mousquetaire_p0/)).toBeInTheDocument();
    expect(
      screen.getByText(/Cette variante P0 verrouille la configuration/),
    ).toBeInTheDocument();
  });

  it("renders turn indicator from authoritative room state", async () => {
    class FakeWebSocket {
      onmessage: ((event: MessageEvent) => void) | null = null;
      close = vi.fn();
    }
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "in_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: { "p-1": "clue_giver_team_a" },
            turn_version: 2,
            active_participant_id: "p-1",
            active_role: "clue_giver_team_a",
            current_clue: null,
            board_cards: [],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 0,
            team_b_score: 0,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["La partie est deja en cours."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/turn/next")) {
        return {
          ok: true,
          json: async () => ({
            turn_version: 3,
            active_participant_id: "p-2",
            active_role: "clue_giver_team_b",
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() => expect(screen.getByText(/Tour v2:/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Passer au tour suivant" }));
    await waitFor(() => expect(screen.getByText(/Tour v3:/)).toBeInTheDocument());
  });

  it("validates and submits clue with accessible composer hints", async () => {
    class FakeWebSocket {
      onmessage: ((event: MessageEvent) => void) | null = null;
      close = vi.fn();
    }
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "in_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: { "p-1": "clue_giver_team_a" },
            turn_version: 2,
            active_participant_id: "p-1",
            active_role: "clue_giver_team_a",
            current_clue: null,
            board_cards: [],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 0,
            team_b_score: 0,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["La partie est deja en cours."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/clue")) {
        return {
          ok: true,
          json: async () => ({
            clue_text: "Voyage",
            clue_giver_participant_id: "p-1",
            turn_version: 2,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() => expect(screen.getByText(/Tour v2:/)).toBeInTheDocument());
    const clueInput = screen.getByLabelText("Indice");
    expect(clueInput).toHaveAttribute("aria-describedby", "clue-help clue-counter");
    expect(screen.getByText(/2 a 24 caracteres/)).toBeInTheDocument();
    expect(screen.getByText(/24 caracteres restants/)).toBeInTheDocument();

    fireEvent.change(clueInput, { target: { value: "Voyage" } });
    fireEvent.click(screen.getByRole("button", { name: "Valider l'indice" }));
    await waitFor(() => expect(screen.getByText("Indice actif: Voyage")).toBeInTheDocument());
  });

  it("renders WordGrid with accessible cards and toggles selection", async () => {
    class FakeWebSocket {
      onmessage: ((event: MessageEvent) => void) | null = null;
      close = vi.fn();
    }
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "in_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: { "p-1": "guesser_team_a" },
            turn_version: 2,
            active_participant_id: "p-1",
            active_role: "guesser_team_a",
            current_clue: "Voyage",
            board_cards: ["Mot0", "Mot1", "Mot2"],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 2,
            team_b_score: 1,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["La partie est deja en cours."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/cards/toggle")) {
        return {
          ok: true,
          json: async () => ({
            selected_card_words: ["Mot1"],
            turn_version: 3,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() => expect(screen.getByTestId("word-card-1")).toBeInTheDocument());
    const card = screen.getByTestId("word-card-1");
    expect(card).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(card);
    await waitFor(() => expect(screen.getByTestId("word-card-1")).toHaveAttribute("aria-pressed", "true"));
  });

  it("applies revealed cards from websocket without duplicate toast spam", async () => {
    class FakeWebSocket {
      static lastInstance: FakeWebSocket | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      close = vi.fn();

      constructor() {
        FakeWebSocket.lastInstance = this;
      }
    }
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "in_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: { "p-1": "guesser_team_a" },
            turn_version: 4,
            active_participant_id: "p-1",
            active_role: "guesser_team_a",
            current_clue: "Voyage",
            board_cards: ["Mot0", "Mot1", "Mot2"],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 1,
            team_b_score: 0,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["La partie est deja en cours."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));
    await waitFor(() => expect(screen.getByText(/Tour v4:/)).toBeInTheDocument());

    const socket = FakeWebSocket.lastInstance;
    expect(socket).not.toBeNull();
    await act(async () => {
      socket?.onmessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "cards_revealed",
            version: 5,
            payload: {
              active_participant_id: "p-1",
              active_role: "guesser_team_a",
              current_clue: "Voyage",
              board_cards: ["Mot0", "Mot1", "Mot2"],
              selected_card_words: [],
              revealed_card_words: ["Mot1"],
            },
          }),
        }),
      );
      socket?.onmessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "cards_revealed",
            version: 5,
            payload: {
              active_participant_id: "p-1",
              active_role: "guesser_team_a",
              current_clue: "Voyage",
              board_cards: ["Mot0", "Mot1", "Mot2"],
              selected_card_words: [],
              revealed_card_words: ["Mot1"],
            },
          }),
        }),
      );
    });

    await waitFor(() =>
      expect(document.querySelectorAll(".toast-message")).toHaveLength(1),
    );
    expect(screen.getAllByText("1 carte(s) revelee(s).")).toHaveLength(2);
  });

  it("renders round resolution panel with beat and next-round CTA", async () => {
    class FakeWebSocket {
      onmessage: ((event: MessageEvent) => void) | null = null;
      close = vi.fn();
    }
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "in_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: { "p-1": "guesser_team_a" },
            turn_version: 9,
            active_participant_id: "p-1",
            active_role: "guesser_team_a",
            current_clue: "Voyage",
            board_cards: ["Mot0"],
            selected_card_words: [],
            revealed_card_words: ["Mot0"],
            round_state: "round_resolution",
            round_result_message: "Manche 1: 1 carte(s) revelee(s).",
            round_resolution_started_at_ms: Date.now(),
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: "next_round",
            team_a_score: 3,
            team_b_score: 2,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["La partie est deja en cours."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() =>
      expect(screen.getByText(/Manche 1: 1 carte\(s\) revelee\(s\)/)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Lancer la manche suivante" })).toBeDisabled();
  });

  it("affiche le tableau des scores et le message de fin en partie terminee", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "game_over",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: { "p-1": "guesser_team_a" },
            turn_version: 42,
            active_participant_id: "p-1",
            active_role: "guesser_team_a",
            current_clue: null,
            board_cards: [],
            selected_card_words: [],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 5,
            next_step_hint: null,
            team_a_score: 8,
            team_b_score: 5,
            game_score_target: 8,
            winning_team_key: "team_a",
            game_end_message:
              "Victoire de l'equipe A. Scores finaux : Equipe A 8, Equipe B 5 (objectif 8).",
            can_start: false,
            blocked_reasons: ["La partie est deja en cours."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() =>
      expect(screen.getByTestId("game-end-message")).toHaveTextContent(/Victoire de l'equipe A/),
    );
    expect(screen.getByTestId("score-team-a")).toHaveTextContent("8");
    expect(screen.getByTestId("score-team-b")).toHaveTextContent("5");
    expect(screen.getByText(/partie terminee/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Valider l'indice" })).not.toBeInTheDocument();
  });

  it("affiche toast et aide inline quand la revelation est refusee par le serveur", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/rooms/join")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            participant_id: "p-1",
            pseudo: "Alex",
            is_host: true,
            player_status: "lobby",
            room_phase: "pre_game",
            status_message: "Salon pre-partie.",
            session_resumed: false,
            diagnostic_ref: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/mega-deck")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            words: [],
            max_words: 25,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/state")) {
        return {
          ok: true,
          json: async () => ({
            room_id: "room-1",
            room_code: "AB12CD",
            phase: "in_game",
            variant_key: "mousquetaire_p0",
            teams_count: 2,
            grid_size: 5,
            black_words: 1,
            participant_roles: { "p-1": "guesser_team_a" },
            turn_version: 4,
            active_participant_id: "p-1",
            active_role: "guesser_team_a",
            current_clue: "Voyage",
            board_cards: ["Mot0", "Mot1"],
            selected_card_words: ["Mot0"],
            revealed_card_words: [],
            round_state: "playing",
            round_result_message: null,
            round_resolution_started_at_ms: null,
            round_resolution_beat_ms: 3000,
            round_number: 1,
            next_step_hint: null,
            team_a_score: 0,
            team_b_score: 0,
            game_score_target: 8,
            winning_team_key: null,
            game_end_message: null,
            current_clue_author_participant_id: null,
            clue_withdraw_allowed: false,
            participants: [],
            can_start: false,
            blocked_reasons: ["La partie est deja en cours."],
            host_participant_id: "p-1",
            host_absence_grace_until_ms: null,
          }),
        } as Response;
      }
      if (url.endsWith("/rooms/AB12CD/cards/reveal")) {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            detail: {
              error_code: "turn_version_conflict",
              message: "Version de tour obsolete. Resynchronisez votre etat.",
            },
          }),
        } as Response;
      }
      throw new Error(`Unhandled fetch call ${url}`);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Code de salle"), {
      target: { value: "ab12cd" },
    });
    fireEvent.change(screen.getByLabelText("Pseudo"), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }));

    await waitFor(() => expect(screen.getByTestId("reveal-selection-button")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("reveal-selection-button"));

    await waitFor(() => {
      expect(screen.getByTestId("reveal-risk-feedback")).toHaveTextContent(
        /Version de tour obsolete/,
      );
    });
    expect(document.querySelectorAll(".toast-message").length).toBeGreaterThanOrEqual(1);
  });

});
