import { useCallback, useEffect, useRef, useState } from "react";

/** Grille fixe V1 pedagogique — meme ritual visuel que le multijoueur (WordGrid + revelation). */
const DEMO_BOARD = [
  "CHAT",
  "CHIEN",
  "OISEAU",
  "POISSON",
  "LAPIN",
  "SOURIS",
  "CHEVAL",
  "ARBRE",
  "TABLE",
];

const DEMO_CLUE = "ANIMAL (exemple d'indice)";

const SOLO_STORAGE_KEY = "mousquetaire_solo_v1";

type PersistedSolo = {
  step: number;
  completedNominal: boolean;
};

function readPersisted(): PersistedSolo {
  try {
    const raw = sessionStorage.getItem(SOLO_STORAGE_KEY);
    if (!raw) {
      return { step: 0, completedNominal: false };
    }
    const o = JSON.parse(raw) as Record<string, unknown>;
    const step = typeof o.step === "number" && o.step >= 0 && o.step <= 3 ? o.step : 0;
    const completedNominal = Boolean(o.completedNominal);
    return { step, completedNominal };
  } catch {
    return { step: 0, completedNominal: false };
  }
}

function writePersisted(step: number, completedNominal: boolean): void {
  try {
    sessionStorage.setItem(
      SOLO_STORAGE_KEY,
      JSON.stringify({ step, completedNominal } satisfies PersistedSolo),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function clearPersisted(): void {
  try {
    sessionStorage.removeItem(SOLO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type SoloLearningProps = {
  onExit: () => void;
};

export function SoloLearning({ onExit }: SoloLearningProps) {
  const persistedOnMount = useRef(readPersisted());

  const [step, setStep] = useState(() =>
    persistedOnMount.current.completedNominal ? 3 : 0,
  );
  const [resumePrompt, setResumePrompt] = useState(
    () =>
      !persistedOnMount.current.completedNominal &&
      persistedOnMount.current.step > 0 &&
      persistedOnMount.current.step < 3,
  );
  const resumeStep = persistedOnMount.current.completedNominal
    ? 0
    : persistedOnMount.current.step;

  const [selectedCardWords, setSelectedCardWords] = useState<string[]>([]);
  const [revealedCardWords, setRevealedCardWords] = useState<string[]>([]);
  const [revealToast, setRevealToast] = useState<string | null>(null);

  useEffect(() => {
    if (resumePrompt) {
      return;
    }
    writePersisted(step, step >= 3);
  }, [step, resumePrompt]);

  useEffect(() => {
    if (step !== 2) {
      return;
    }
    setSelectedCardWords([]);
    setRevealedCardWords([]);
    setRevealToast(null);
  }, [step]);

  const handleToggleCard = useCallback((cardWord: string) => {
    if (revealedCardWords.includes(cardWord)) {
      return;
    }
    setSelectedCardWords((current) =>
      current.includes(cardWord) ? current.filter((w) => w !== cardWord) : [...current, cardWord],
    );
  }, [revealedCardWords]);

  const handleReveal = () => {
    if (selectedCardWords.length === 0) {
      return;
    }
    const count = selectedCardWords.length;
    setRevealedCardWords((prev) => [...new Set([...prev, ...selectedCardWords])]);
    setSelectedCardWords([]);
    const message = `${count} carte(s) revelee(s).`;
    setRevealToast(message);
    globalThis.setTimeout(() => setRevealToast(null), 3500);
  };

  const restartFromBeginning = () => {
    clearPersisted();
    setResumePrompt(false);
    persistedOnMount.current = { step: 0, completedNominal: false };
    setStep(0);
    setSelectedCardWords([]);
    setRevealedCardWords([]);
    setRevealToast(null);
    writePersisted(0, false);
  };

  const resumeProgress = () => {
    setResumePrompt(false);
    setStep(resumeStep);
  };

  return (
    <section data-testid="solo-learning" aria-labelledby="solo-learning-title">
      <h2 id="solo-learning-title">Mode apprentissage (solo)</h2>
      <p className="muted">
        Parcours hors salle multijoueur — aucun code de salle ni pseudo requis pour ces etapes (
        FR17).
      </p>
      <p className="muted solo-progress-hint">
        Progression V1 : memorisee dans cet onglet du navigateur (session). Si vous quittez avant la
        fin du parcours nominal, vous pouvez <strong>reprendre</strong> ou{" "}
        <strong>recommencer</strong> depuis le premier ecran. Fermer l&apos;onglet ou le navigateur
        efface cette memoire.
      </p>

      {resumePrompt ? (
        <section
          className="solo-resume-panel"
          role="region"
          aria-label="Reprise du parcours solo"
          data-testid="solo-resume-panel"
        >
          <p>
            Vous aviez commence le parcours (etape sauvegardee). Reprendre a votre position ou tout
            recommencer ?
          </p>
          <button type="button" onClick={resumeProgress} data-testid="solo-resume-button">
            Reprendre
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={restartFromBeginning}
            data-testid="solo-restart-from-resume-button"
          >
            Recommencer depuis le debut
          </button>
        </section>
      ) : null}

      {persistedOnMount.current.completedNominal && step === 3 && !resumePrompt ? (
        <p className="muted" role="status">
          Parcours nominal deja termine dans cette session — vous pouvez consulter le recap
          ci-dessous ou recommencer.
        </p>
      ) : null}

      {step === 0 && !resumePrompt ? (
        <>
          <p>
            Bienvenue dans l&apos;entrainement Mousquetaire. Vous progressez a votre rythme, sans
            creer ni rejoindre une partie en ligne.
          </p>
          <button type="button" onClick={() => setStep(1)}>
            Continuer
          </button>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <p>
            En partie complete, un joueur donne un <strong>indice</strong> et les devineurs
            selectionnent des cartes sur la grille. La <strong>revelation</strong> rend les choix
            visibles pour tous — meme geste et memes composants visuels qu&apos;en multijoueur (
            UX-DR10).
          </p>
          <p className="muted">
            La revelation est definitive en V1 — comme en partie reelle, sans annulation apres
            validation.
          </p>
          <button type="button" onClick={() => setStep(2)}>
            Continuer vers l&apos;atelier grille
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <section className="solo-workshop" aria-labelledby="solo-workshop-title">
            <h3 id="solo-workshop-title">Atelier: selection et revelation</h3>
            <p className="muted">
              Indice fictif pour cet exercice (les cartes ne sont pas verifiees par un serveur ici).
            </p>
            <p>
              <span className="solo-demo-clue">Indice actif:</span> {DEMO_CLUE}
            </p>
            <button
              type="button"
              onClick={handleReveal}
              disabled={selectedCardWords.length === 0}
              data-testid="solo-reveal-selection-button"
            >
              Reveler la selection
            </button>
            <p id="solo-reveal-no-undo-hint" className="muted reveal-irreversible-hint">
              La revelation est definitive en V1 — sans annulation.
            </p>
            <div className="sr-only-live" role="status" aria-live="polite" aria-atomic="true">
              {revealToast}
            </div>
            {revealToast ? (
              <section className="toast-stack" aria-label="Notification atelier" aria-live="assertive">
                <p className="toast-message">{revealToast}</p>
              </section>
            ) : null}
            <p id="solo-selection-toggle-hint" className="muted">
              Pour corriger une selection, appuyez de nouveau sur la meme carte.
            </p>
            <section className="word-grid word-grid-solo-nine" aria-label="WordGrid">
              {DEMO_BOARD.map((cardWord, index) => {
                const isSelected = selectedCardWords.includes(cardWord);
                const isRevealed = revealedCardWords.includes(cardWord);
                return (
                  <button
                    key={cardWord}
                    type="button"
                    className={
                      isRevealed ? "word-card revealed" : isSelected ? "word-card selected" : "word-card"
                    }
                    data-testid={`solo-word-card-${index}`}
                    aria-pressed={isSelected}
                    aria-describedby={isRevealed ? "solo-revealed-hint" : undefined}
                    onClick={() => handleToggleCard(cardWord)}
                    disabled={isRevealed}
                  >
                    {cardWord}
                  </button>
                );
              })}
            </section>
            <p id="solo-revealed-hint" className="muted">
              Les cartes revelees sont verrouillees pour la suite de cet exercice.
            </p>
          </section>
          <button type="button" className="btn-secondary" onClick={() => setStep(3)}>
            Terminer le parcours nominal
          </button>
        </>
      ) : null}

      {step >= 3 ? (
        <section
          id="solo-completion"
          className="solo-completion-panel"
          aria-labelledby="solo-completion-title"
          role="region"
          data-testid="solo-completion-panel"
        >
          <h3 id="solo-completion-title">Parcours nominal termine</h3>
          <p className="solo-completion-lead">
            Felicitations — vous avez complete l&apos;entrainement V1 prevu sans partie multijoueur (
            FR18).
          </p>
          <ul className="solo-completion-recap">
            <li>Introduction aux roles indice / devineur et au geste de revelation partagee.</li>
            <li>Atelier grille local avec les memes composants visuels que le mode multijoueur.</li>
            <li>Rappel : en partie en ligne, la grille et les scores sont autoritatifs cote serveur.</li>
          </ul>
          <p className="muted">
            Etape suivante hors tutoriel : creer ou rejoindre une salle depuis le mode multijoueur.
          </p>
          <button type="button" onClick={onExit} data-testid="solo-completion-return-multi">
            Retour au mode multijoueur
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={restartFromBeginning}
            data-testid="solo-completion-restart"
          >
            Recommencer le parcours
          </button>
        </section>
      ) : null}

      {step < 3 ? (
        <button type="button" className="btn-secondary" onClick={onExit}>
          Quitter le mode apprentissage
        </button>
      ) : null}
    </section>
  );
}
