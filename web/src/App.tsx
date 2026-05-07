import { useEffect, useState } from "react";

import { MAX_PLAYERS_PER_ROOM, ROOM_CODE_LENGTH } from "./lib/gameLimits";
import { isOutsideBrowserMatrix } from "./lib/browserMatrix";
import { addMegaDeckWord, createRoom, fetchMegaDeck, joinRoom } from "./lib/api";

const APP_VERSION = __APP_VERSION__;

function App() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [joinedStatus, setJoinedStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [deckWord, setDeckWord] = useState("");
  const [megaDeckWords, setMegaDeckWords] = useState<string[]>([]);
  const [maxMegaDeckWords, setMaxMegaDeckWords] = useState(25);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(() =>
    isOutsideBrowserMatrix(globalThis.navigator?.userAgent ?? ""),
  );

  const handleCreateRoom = async () => {
    if (isCreating || isJoining) {
      return;
    }
    setErrorMessage(null);
    setJoinedStatus(null);
    setIsCreating(true);
    try {
      const room = await createRoom();
      setRoomCode(room.room_code);
      setJoinCode(room.room_code);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de creer la salle pour le moment.";
      setErrorMessage(message);
      setRoomCode(null);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (isJoining || isCreating) {
      return;
    }
    setJoinedStatus(null);
    const normalizedCode = joinCode.trim().toUpperCase();
    const normalizedPseudo = pseudo.trim();
    if (!normalizedCode || normalizedPseudo.length < 2) {
      setErrorMessage("Code de salle ou pseudo invalide.");
      return;
    }
    setJoinCode(normalizedCode);
    setPseudo(normalizedPseudo);
    setErrorMessage(null);
    setIsJoining(true);
    try {
      const joined = await joinRoom({ roomCode: normalizedCode, pseudo: normalizedPseudo });
      setJoinedStatus(
        `Pseudo ${joined.pseudo} rejoint la salle ${joined.room_code}. Session active.`,
      );
      setRoomCode(joined.room_code);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de rejoindre la salle pour le moment.";
      setErrorMessage(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAddMegaDeckWord = async () => {
    if (!roomCode || isAddingWord) {
      return;
    }
    const normalizedWord = deckWord.trim();
    if (normalizedWord.length < 2) {
      setErrorMessage("Le mot doit contenir au moins 2 caracteres.");
      return;
    }
    setErrorMessage(null);
    setIsAddingWord(true);
    try {
      const updatedDeck = await addMegaDeckWord({ roomCode, word: normalizedWord });
      setMegaDeckWords(updatedDeck.words);
      setMaxMegaDeckWords(updatedDeck.max_words);
      setDeckWord("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible d'ajouter ce mot.";
      setErrorMessage(message);
    } finally {
      setIsAddingWord(false);
    }
  };

  useEffect(() => {
    const loadMegaDeck = async () => {
      if (!roomCode) {
        setMegaDeckWords([]);
        setMaxMegaDeckWords(25);
        return;
      }
      try {
        const deck = await fetchMegaDeck(roomCode);
        setMegaDeckWords(deck.words);
        setMaxMegaDeckWords(deck.max_words);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Impossible de charger le mega-deck.";
        setErrorMessage(message);
      }
    };
    void loadMegaDeck();
  }, [roomCode]);

  return (
    <main className="layout">
      <section className="card">
        <h1>Mousquetaire</h1>
        {showBrowserWarning ? (
          <section className="browser-warning" role="status" aria-live="polite">
            <p>
              Votre navigateur est hors matrice V1. Des comportements inattendus peuvent survenir.
            </p>
            <p>
              Consultez la{" "}
              <a href="https://example.com/mousquetaire/matrice-navigateurs-v1">
                matrice navigateurs V1
              </a>{" "}
              puis continuez si vous le souhaitez.
            </p>
            <button type="button" onClick={() => setShowBrowserWarning(false)}>
              Essayer quand meme
            </button>
          </section>
        ) : null}
        <p>Cree une salle ou rejoins une salle existante avec ton pseudo.</p>
        <p className="muted">
          Regles V1: code de salle alphanumerique sur {ROOM_CODE_LENGTH} caracteres, capacite max{" "}
          {MAX_PLAYERS_PER_ROOM} joueurs.
        </p>
        <button type="button" onClick={handleCreateRoom} disabled={isCreating || isJoining}>
          {isCreating ? "Creation..." : "Creer une salle"}
        </button>
        {roomCode ? (
          <p className="room-code">
            Code de salle: <strong>{roomCode}</strong>
          </p>
        ) : null}
        <form
          className="join-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleJoinRoom();
          }}
        >
          <label htmlFor="room-code">Code de salle</label>
          <input
            id="room-code"
            name="room-code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            onBlur={(event) => setJoinCode(event.target.value.trim().toUpperCase())}
            autoComplete="off"
            maxLength={ROOM_CODE_LENGTH}
            required
          />
          <label htmlFor="pseudo">Pseudo</label>
          <input
            id="pseudo"
            name="pseudo"
            value={pseudo}
            onChange={(event) => setPseudo(event.target.value)}
            autoComplete="nickname"
            minLength={2}
            maxLength={24}
            required
          />
          <button type="submit" disabled={isJoining || isCreating}>
            {isJoining ? "Connexion..." : "Rejoindre la salle"}
          </button>
        </form>
        {roomCode ? (
          <section className="mega-deck-panel" aria-labelledby="mega-deck-title">
            <h2 id="mega-deck-title">Mega-deck collaboratif (V1)</h2>
            <p className="muted">
              Ajoutez des mots pour preparer la partie ({megaDeckWords.length}/{maxMegaDeckWords}).
            </p>
            <div className="mega-deck-input-row">
              <label htmlFor="mega-deck-word">Mot a ajouter</label>
              <input
                id="mega-deck-word"
                name="mega-deck-word"
                value={deckWord}
                onChange={(event) => setDeckWord(event.target.value)}
                autoComplete="off"
                maxLength={32}
              />
              <button type="button" onClick={handleAddMegaDeckWord} disabled={isAddingWord}>
                {isAddingWord ? "Ajout..." : "Ajouter au mega-deck"}
              </button>
            </div>
            <ul className="mega-deck-list">
              {megaDeckWords.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {joinedStatus ? <p className="room-code">{joinedStatus}</p> : null}
        {errorMessage ? (
          <p className="error-message" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <footer className="legal-footer" aria-label="Liens legaux">
          <a href="#cgu">CGU</a>
          <a href="#risques-contenu">Risques contenu</a>
          <a href="#a-propos">A propos</a>
          <a href="#persistance-v1">Persistance V1</a>
        </footer>
        <section id="cgu" className="legal-panel" aria-labelledby="cgu-title">
          <h2 id="cgu-title">Conditions generales d'utilisation</h2>
          <p>
            Mousquetaire est reserve a un public 18+ pour des sessions entre amis. Les
            utilisateurs restent responsables des mots saisis pendant la partie.
          </p>
        </section>
        <section
          id="risques-contenu"
          className="legal-panel"
          aria-labelledby="risques-title"
        >
          <h2 id="risques-title">Risques lies au contenu joueur</h2>
          <p>
            Aucun filtre automatique n'est applique sur les mots des joueurs en V1. Certains
            contenus peuvent etre choquants: jouez uniquement avec des personnes de confiance.
          </p>
        </section>
        <section id="a-propos" className="legal-panel" aria-labelledby="about-title">
          <h2 id="about-title">A propos</h2>
          <p>Version du build: {APP_VERSION}</p>
          <p className="muted">Notes: socle MVP multijoueur, legal et jointure de salle.</p>
        </section>
        <section
          id="persistance-v1"
          className="legal-panel"
          aria-labelledby="persistence-title"
        >
          <h2 id="persistence-title">Persistance V1 et compte utilisateur</h2>
          <p>
            Aucun compte email/mot de passe n'est requis pour creer ou rejoindre une salle en
            V1.
          </p>
          <p>
            Les parties ne sont pas sauvegardees entre sessions: les donnees de jeu sont
            volatiles.
          </p>
          <p className="muted">
            Exception possible: quelques preferences locales non critiques peuvent rester dans le
            navigateur.
          </p>
        </section>
        <p className="muted">Story 1.6 - francais UI, sans compte et persistance V1.</p>
      </section>
    </main>
  );
}

export default App;
