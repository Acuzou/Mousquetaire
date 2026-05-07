import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
          json: async () => ({ room_id: "room-1", room_code: "AB12CD" }),
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
        json: async () => ({ room_id: "room-1", room_code: "AB12CD" }),
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
        json: async () => ({ room_id: "room-1", room_code: "AB12CD" }),
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
    const aboutLink = screen.getByRole("link", { name: "A propos" });
    const persistenceLink = screen.getByRole("link", { name: "Persistance V1" });

    expect(cguLink).toHaveAttribute("href", "#cgu");
    expect(riskLink).toHaveAttribute("href", "#risques-contenu");
    expect(aboutLink).toHaveAttribute("href", "#a-propos");
    expect(persistenceLink).toHaveAttribute("href", "#persistance-v1");
    expect(
      screen.getByText("Conditions generales d'utilisation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aucun filtre automatique n'est applique sur les mots des joueurs en V1/),
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
});
