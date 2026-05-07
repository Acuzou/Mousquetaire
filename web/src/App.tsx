import { useCallback, useEffect, useRef, useState } from "react";

import { MAX_PLAYERS_PER_ROOM, ROOM_CODE_LENGTH } from "./lib/gameLimits";
import { isOutsideBrowserMatrix } from "./lib/browserMatrix";
import {
  API_BASE_URL,
  addMegaDeckWord,
  advanceTurn,
  continueRound,
  createRoom,
  fetchAiAssistPing,
  fetchAiAssistStatus,
  fetchMegaDeck,
  fetchRoomState,
  joinRoom,
  leaveRoom,
  revealSelectedCards,
  submitClue,
  toggleCardSelection,
  withdrawClue,
  startGame,
} from "./lib/api";
import { readAiAssistSessionPref, writeAiAssistSessionPref } from "./lib/aiAssistPrefs";
import { ApiRequestError } from "./lib/apiErrors";
import { SoloLearning } from "./features/solo/SoloLearning";

const APP_VERSION = __APP_VERSION__;
type AppShell = "multi" | "solo";
type TurnAggregate = {
  version: number;
  activeParticipantId: string | null;
  activeRole: string | null;
  currentClue: string | null;
  boardCards: string[];
  selectedCardWords: string[];
  revealedCardWords: string[];
  roundState: string;
  roundResultMessage: string | null;
  roundResolutionStartedAtMs: number | null;
  roundResolutionBeatMs: number;
  roundNumber: number;
  nextStepHint: string | null;
  teamAScore: number;
  teamBScore: number;
  gameScoreTarget: number;
  winningTeamKey: string | null;
  gameEndMessage: string | null;
  currentClueAuthorParticipantId: string | null;
  clueWithdrawAllowed: boolean;
};

type JoinCapacity = "lobby" | "player" | "spectator";

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
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [roomPhase, setRoomPhase] = useState("pre_game");
  const [variantKey, setVariantKey] = useState("mousquetaire_p0");
  const [variantTeamsCount, setVariantTeamsCount] = useState(2);
  const [variantGridSize, setVariantGridSize] = useState(5);
  const [variantBlackWords, setVariantBlackWords] = useState(1);
  const [participantRolesCount, setParticipantRolesCount] = useState(0);
  const [turnState, setTurnState] = useState<TurnAggregate>({
    version: 0,
    activeParticipantId: null,
    activeRole: null,
    currentClue: null,
    boardCards: [],
    selectedCardWords: [],
    revealedCardWords: [],
    roundState: "playing",
    roundResultMessage: null,
    roundResolutionStartedAtMs: null,
    roundResolutionBeatMs: 3000,
    roundNumber: 1,
    nextStepHint: null,
    teamAScore: 0,
    teamBScore: 0,
    gameScoreTarget: 8,
    winningTeamKey: null,
    gameEndMessage: null,
    currentClueAuthorParticipantId: null,
    clueWithdrawAllowed: false,
  });
  const turnStateRef = useRef<TurnAggregate>(turnState);
  const seenEventKeysRef = useRef<Set<string>>(new Set());
  const lastLiveRevealVersionRef = useRef(0);
  const [isAdvancingTurn, setIsAdvancingTurn] = useState(false);
  const [isRevealingCards, setIsRevealingCards] = useState(false);
  const [isContinuingRound, setIsContinuingRound] = useState(false);
  const [isWithdrawingClue, setIsWithdrawingClue] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [joinCapacity, setJoinCapacity] = useState<JoinCapacity>("lobby");
  const [joinStatusDetail, setJoinStatusDetail] = useState<string | null>(null);
  /** Incrementé pendant RoundResolution pour rafraîchir le décompte affiché */
  const [roundResolutionBeatTick, setRoundResolutionBeatTick] = useState(0);
  const [clueInput, setClueInput] = useState("");
  const [isSubmittingClue, setIsSubmittingClue] = useState(false);
  const [clueErrorMessage, setClueErrorMessage] = useState<string | null>(null);
  const [revealAnnouncement, setRevealAnnouncement] = useState<string | null>(null);
  const [toastMessages, setToastMessages] = useState<string[]>([]);
  const [revealRiskFeedback, setRevealRiskFeedback] = useState<string | null>(null);
  const [selectionRiskFeedback, setSelectionRiskFeedback] = useState<string | null>(null);
  const [turnRiskFeedback, setTurnRiskFeedback] = useState<string | null>(null);
  const [roundContinueRiskFeedback, setRoundContinueRiskFeedback] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hostAbsenceGraceUntilMs, setHostAbsenceGraceUntilMs] = useState<number | null>(null);
  const [hostGraceBannerTick, setHostGraceBannerTick] = useState(0);
  type LiveEventsMode = "idle" | "connected" | "reconnecting" | "paused";
  const [liveEventsMode, setLiveEventsMode] = useState<LiveEventsMode>("idle");
  const wsHadOpenedInEffectRef = useRef(false);
  const [startBlockedReasons, setStartBlockedReasons] = useState<string[]>([]);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(() =>
    isOutsideBrowserMatrix(globalThis.navigator?.userAgent ?? ""),
  );
  const [appShell, setAppShell] = useState<AppShell>("multi");
  const [supportDiagnosticRef, setSupportDiagnosticRef] = useState<string | null>(null);
  const [aiAssistPrefEnabled, setAiAssistPrefEnabled] = useState(() =>
    readAiAssistSessionPref(),
  );
  const [aiAssistServerMessage, setAiAssistServerMessage] = useState<string | null>(null);
  const [aiAssistStatusLoading, setAiAssistStatusLoading] = useState(false);
  const [aiAssistPingLoading, setAiAssistPingLoading] = useState(false);

  const handleAiAssistPrefChange = (enabled: boolean) => {
    writeAiAssistSessionPref(enabled);
    setAiAssistPrefEnabled(enabled);
  };

  const handleRefreshAiAssistStatus = async () => {
    setAiAssistStatusLoading(true);
    setAiAssistServerMessage(null);
    try {
      const status = await fetchAiAssistStatus();
      setAiAssistServerMessage(status.message_fr);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de joindre le serveur pour le statut assist IA.";
      setAiAssistServerMessage(message);
    } finally {
      setAiAssistStatusLoading(false);
    }
  };

  const handlePingAiAssist = async () => {
    setAiAssistPingLoading(true);
    try {
      const ping = await fetchAiAssistPing(aiAssistPrefEnabled);
      setAiAssistServerMessage(ping.message_fr);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de joindre le serveur pour la verification assist IA.";
      setAiAssistServerMessage(message);
    } finally {
      setAiAssistPingLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (isCreating || isJoining) {
      return;
    }
    setErrorMessage(null);
    setJoinedStatus(null);
    setSupportDiagnosticRef(null);
    setIsCreating(true);
    try {
      const room = await createRoom();
      setSupportDiagnosticRef(room.diagnostic_ref);
      setRoomCode(room.room_code);
      setJoinCode(room.room_code);
      setParticipantId(null);
      setIsHost(false);
      setRoomPhase("pre_game");
      setVariantKey("mousquetaire_p0");
      setVariantTeamsCount(2);
      setVariantGridSize(5);
      setVariantBlackWords(1);
      setParticipantRolesCount(0);
      setTurnState({
        version: 0,
        activeParticipantId: null,
        activeRole: null,
        currentClue: null,
        boardCards: [],
        selectedCardWords: [],
        revealedCardWords: [],
        roundState: "playing",
        roundResultMessage: null,
        roundResolutionStartedAtMs: null,
        roundResolutionBeatMs: 3000,
        roundNumber: 1,
        nextStepHint: null,
        teamAScore: 0,
        teamBScore: 0,
        gameScoreTarget: 8,
        winningTeamKey: null,
        gameEndMessage: null,
        currentClueAuthorParticipantId: null,
        clueWithdrawAllowed: false,
      });
      seenEventKeysRef.current.clear();
      lastLiveRevealVersionRef.current = 0;
      setSyncMessage(null);
      setClueInput("");
      setClueErrorMessage(null);
      setRevealAnnouncement(null);
      setToastMessages([]);
      setRevealRiskFeedback(null);
      setSelectionRiskFeedback(null);
      setTurnRiskFeedback(null);
      setRoundContinueRiskFeedback(null);
      setStartBlockedReasons([]);
      setJoinCapacity("lobby");
      setJoinStatusDetail(null);
      setHostAbsenceGraceUntilMs(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de creer la salle pour le moment.";
      setErrorMessage(message);
      setRoomCode(null);
      setSupportDiagnosticRef(null);
    } finally {
      setIsCreating(false);
    }
  };

  const pushToast = useCallback((message: string) => {
    setToastMessages((current) => {
      const next = [...current, message];
      return next.slice(-3);
    });
  }, []);

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
      setSupportDiagnosticRef(joined.diagnostic_ref);
      setJoinedStatus(
        `Pseudo ${joined.pseudo} rejoint la salle ${joined.room_code}. Session active.`,
      );
      setRoomCode(joined.room_code);
      setParticipantId(joined.participant_id);
      setIsHost(joined.is_host);
      setRoomPhase(joined.room_phase);
      const ps = joined.player_status;
      setJoinCapacity(
        ps === "lobby" || ps === "player" || ps === "spectator" ? ps : "lobby",
      );
      setJoinStatusDetail(joined.status_message);
      setHostAbsenceGraceUntilMs(null);
      if (joined.session_resumed) {
        pushToast("Session reprise — etat resynchronise depuis le serveur.");
      }
      seenEventKeysRef.current.clear();
      lastLiveRevealVersionRef.current = 0;
      setRevealRiskFeedback(null);
      setSelectionRiskFeedback(null);
      setTurnRiskFeedback(null);
      setRoundContinueRiskFeedback(null);
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

  const handleStartGame = async () => {
    if (!roomCode || !participantId || !isHost || isStartingGame) {
      return;
    }
    setErrorMessage(null);
    setIsStartingGame(true);
    try {
      const started = await startGame({ roomCode, participantId });
      setRoomPhase(started.phase);
      setVariantKey(started.variant_key);
      setVariantTeamsCount(started.teams_count);
      setVariantGridSize(started.grid_size);
      setVariantBlackWords(started.black_words);
      setParticipantRolesCount(Object.keys(started.participant_roles).length);
      setTurnState({
        version: started.turn_version,
        activeParticipantId: started.active_participant_id,
        activeRole: started.active_role,
        currentClue: null,
        boardCards: [],
        selectedCardWords: [],
        revealedCardWords: [],
        roundState: "playing",
        roundResultMessage: null,
        roundResolutionStartedAtMs: null,
        roundResolutionBeatMs: 3000,
        roundNumber: 1,
        nextStepHint: null,
        teamAScore: 0,
        teamBScore: 0,
        gameScoreTarget: 8,
        winningTeamKey: null,
        gameEndMessage: null,
        currentClueAuthorParticipantId: null,
        clueWithdrawAllowed: false,
      });
      setStartBlockedReasons([]);
      setRevealRiskFeedback(null);
      setSelectionRiskFeedback(null);
      setTurnRiskFeedback(null);
      setRoundContinueRiskFeedback(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de demarrer la partie.";
      setErrorMessage(message);
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleAdvanceTurn = async () => {
    if (!roomCode || !participantId || roomPhase !== "in_game" || isAdvancingTurn) {
      return;
    }
    if (turnState.roundState === "round_resolution") {
      pushToast("Fin de manche : attendez la transition avant de passer le tour.");
      setTurnRiskFeedback("Fin de manche en cours — le tour reprendra avec la manche suivante.");
      return;
    }
    setIsAdvancingTurn(true);
    setErrorMessage(null);
    setTurnRiskFeedback(null);
    try {
      const nextTurn = await advanceTurn({
        roomCode,
        participantId,
        clientVersion: turnState.version,
      });
      const nextRole = nextTurn.active_role || "";
      const clearsClueForNextSpymaster = nextRole.startsWith("clue_giver_");
      setTurnState((current) => ({
        ...current,
        version: nextTurn.turn_version,
        activeParticipantId: nextTurn.active_participant_id,
        activeRole: nextTurn.active_role,
        currentClue: clearsClueForNextSpymaster ? null : current.currentClue,
        currentClueAuthorParticipantId: clearsClueForNextSpymaster
          ? null
          : current.currentClueAuthorParticipantId,
        clueWithdrawAllowed: clearsClueForNextSpymaster ? false : current.clueWithdrawAllowed,
        selectedCardWords: [],
        revealedCardWords: current.revealedCardWords,
        roundState: current.roundState,
        roundResultMessage: current.roundResultMessage,
        roundResolutionStartedAtMs: current.roundResolutionStartedAtMs,
        roundResolutionBeatMs: current.roundResolutionBeatMs,
        roundNumber: current.roundNumber,
        nextStepHint: current.nextStepHint,
        teamAScore: current.teamAScore,
        teamBScore: current.teamBScore,
        gameScoreTarget: current.gameScoreTarget,
        winningTeamKey: current.winningTeamKey,
        gameEndMessage: current.gameEndMessage,
      }));
      setSyncMessage(null);
      setClueInput("");
      setClueErrorMessage(null);
      setRevealAnnouncement(null);
    } catch (error) {
      const message = riskFeedbackFromError(error, "Impossible d'avancer le tour.");
      setTurnRiskFeedback(message);
      pushToast(message);
      setErrorMessage(null);
    } finally {
      setIsAdvancingTurn(false);
    }
  };

  const riskFeedbackFromError = (error: unknown, fallback: string) => {
    if (error instanceof ApiRequestError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  };

  const handleToggleCard = async (cardWord: string) => {
    if (!roomCode || !participantId || isAdvancingTurn) {
      return;
    }
    if (turnState.roundState === "round_resolution") {
      pushToast("Fin de manche : la grille est en lecture seule.");
      setSelectionRiskFeedback("La selection est suspendue pendant la fin de manche.");
      return;
    }
    try {
      setSelectionRiskFeedback(null);
      const updated = await toggleCardSelection({
        roomCode,
        participantId,
        cardWord,
        clientVersion: turnState.version,
      });
      setTurnState((current) => ({
        ...current,
        version: updated.turn_version,
        selectedCardWords: updated.selected_card_words,
      }));
      setErrorMessage(null);
    } catch (error) {
      const message = riskFeedbackFromError(error, "Impossible de selectionner cette carte.");
      setSelectionRiskFeedback(message);
      pushToast(message);
      setErrorMessage(null);
    }
  };

  const handleRevealCards = async () => {
    if (!roomCode || !participantId || isRevealingCards) {
      return;
    }
    if (turnState.roundState === "round_resolution") {
      return;
    }
    setErrorMessage(null);
    setRevealRiskFeedback(null);
    setIsRevealingCards(true);
    try {
      const revealed = await revealSelectedCards({
        roomCode,
        participantId,
        clientVersion: turnState.version,
      });
      if (revealed.phase === "game_over") {
        setRoomPhase("game_over");
      }
      setTurnState((current) => ({
        ...current,
        version: revealed.turn_version,
        revealedCardWords: revealed.revealed_card_words,
        selectedCardWords: [],
        roundState: revealed.round_state,
        roundResultMessage: revealed.round_result_message,
        roundResolutionStartedAtMs: revealed.round_resolution_started_at_ms,
        roundResolutionBeatMs: revealed.round_resolution_beat_ms,
        roundNumber: revealed.round_number,
        nextStepHint: revealed.next_step_hint,
        teamAScore: revealed.team_a_score,
        teamBScore: revealed.team_b_score,
        gameScoreTarget: revealed.game_score_target,
        winningTeamKey: revealed.winning_team_key,
        gameEndMessage: revealed.game_end_message,
        currentClueAuthorParticipantId: null,
        clueWithdrawAllowed: false,
      }));
      if (revealed.revealed_now_words.length > 0) {
        const message = `${revealed.revealed_now_words.length} carte(s) revelee(s).`;
        setRevealAnnouncement(message);
        pushToast(message);
        lastLiveRevealVersionRef.current = revealed.turn_version;
      }
    } catch (error) {
      const message = riskFeedbackFromError(error, "Impossible de reveler les cartes.");
      setRevealRiskFeedback(message);
      pushToast(message);
      setErrorMessage(null);
    } finally {
      setIsRevealingCards(false);
    }
  };

  const handleContinueRound = async () => {
    if (!roomCode || !participantId || isContinuingRound) {
      return;
    }
    setErrorMessage(null);
    setRoundContinueRiskFeedback(null);
    setIsContinuingRound(true);
    try {
      const continued = await continueRound({
        roomCode,
        participantId,
        clientVersion: turnState.version,
      });
      setTurnState((current) => ({
        ...current,
        version: continued.turn_version,
        activeParticipantId: continued.active_participant_id,
        activeRole: continued.active_role,
        currentClue: null,
        selectedCardWords: [],
        revealedCardWords: [],
        roundState: "playing",
        roundResultMessage: null,
        roundResolutionStartedAtMs: null,
        roundNumber: continued.round_number,
        nextStepHint: null,
        currentClueAuthorParticipantId: null,
        clueWithdrawAllowed: false,
      }));
      setRevealAnnouncement("Manche suivante lancee.");
      pushToast("Manche suivante — plateau reinitialise.");
    } catch (error) {
      const message = riskFeedbackFromError(error, "Impossible de lancer la manche suivante.");
      setRoundContinueRiskFeedback(message);
      pushToast(message);
      setErrorMessage(null);
    } finally {
      setIsContinuingRound(false);
    }
  };

  const handleSubmitClue = async () => {
    if (!roomCode || !participantId || isSubmittingClue) {
      return;
    }
    const normalizedClue = clueInput.trim();
    if (!normalizedClue) {
      setClueErrorMessage("Saisissez un indice.");
      return;
    }
    setClueErrorMessage(null);
    setErrorMessage(null);
    setIsSubmittingClue(true);
    try {
      const submitted = await submitClue({
        roomCode,
        participantId,
        clueText: normalizedClue,
      });
      setTurnState((current) => ({
        ...current,
        version: Math.max(current.version, submitted.turn_version),
        currentClue: submitted.clue_text,
        currentClueAuthorParticipantId: participantId,
        clueWithdrawAllowed: true,
      }));
      setClueInput("");
      pushToast("Indice accepte — visible pour la table.");
    } catch (error) {
      const message = riskFeedbackFromError(error, "Impossible de valider l'indice.");
      setClueErrorMessage(message);
      pushToast(message);
    } finally {
      setIsSubmittingClue(false);
    }
  };

  const handleWithdrawClue = async () => {
    if (!roomCode || !participantId || isWithdrawingClue) {
      return;
    }
    setIsWithdrawingClue(true);
    setClueErrorMessage(null);
    try {
      const result = await withdrawClue({
        roomCode,
        participantId,
        clientVersion: turnState.version,
      });
      setTurnState((current) => ({
        ...current,
        version: result.turn_version,
        currentClue: null,
        currentClueAuthorParticipantId: null,
        clueWithdrawAllowed: false,
      }));
      pushToast("Indice retire — vous pouvez en soumettre un autre.");
    } catch (error) {
      const message = riskFeedbackFromError(error, "Impossible de retirer l'indice.");
      setClueErrorMessage(message);
      pushToast(message);
    } finally {
      setIsWithdrawingClue(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomCode || !participantId || isLeavingRoom) {
      return;
    }
    setIsLeavingRoom(true);
    setErrorMessage(null);
    try {
      await leaveRoom({ roomCode, participantId });
      pushToast("Vous avez quitte la salle.");
      setSupportDiagnosticRef(null);
      setRoomCode(null);
      setParticipantId(null);
      setIsHost(false);
      setJoinedStatus(null);
      setRoomPhase("pre_game");
      setParticipantRolesCount(0);
      setTurnState({
        version: 0,
        activeParticipantId: null,
        activeRole: null,
        currentClue: null,
        boardCards: [],
        selectedCardWords: [],
        revealedCardWords: [],
        roundState: "playing",
        roundResultMessage: null,
        roundResolutionStartedAtMs: null,
        roundResolutionBeatMs: 3000,
        roundNumber: 1,
        nextStepHint: null,
        teamAScore: 0,
        teamBScore: 0,
        gameScoreTarget: 8,
        winningTeamKey: null,
        gameEndMessage: null,
        currentClueAuthorParticipantId: null,
        clueWithdrawAllowed: false,
      });
      seenEventKeysRef.current.clear();
      lastLiveRevealVersionRef.current = 0;
      setSyncMessage(null);
      setClueInput("");
      setClueErrorMessage(null);
      setRevealAnnouncement(null);
      setRevealRiskFeedback(null);
      setSelectionRiskFeedback(null);
      setTurnRiskFeedback(null);
      setRoundContinueRiskFeedback(null);
      setMegaDeckWords([]);
      setMaxMegaDeckWords(25);
      setStartBlockedReasons([]);
      setJoinCapacity("lobby");
      setJoinStatusDetail(null);
      setHostAbsenceGraceUntilMs(null);
    } catch (error) {
      const message = riskFeedbackFromError(error, "Impossible de quitter la salle pour le moment.");
      setErrorMessage(message);
      pushToast(message);
    } finally {
      setIsLeavingRoom(false);
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

  useEffect(() => {
    const loadRoomState = async () => {
      if (!roomCode) {
        setRoomPhase("pre_game");
        setStartBlockedReasons([]);
        setHostAbsenceGraceUntilMs(null);
        return;
      }
      try {
        const state = await fetchRoomState(roomCode);
        setRoomPhase(state.phase);
        setVariantKey(state.variant_key);
        setVariantTeamsCount(state.teams_count);
        setVariantGridSize(state.grid_size);
        setVariantBlackWords(state.black_words);
        setParticipantRolesCount(Object.keys(state.participant_roles).length);
        setTurnState((current) =>
          state.turn_version >= current.version
            ? {
                version: state.turn_version,
                activeParticipantId: state.active_participant_id,
                activeRole: state.active_role,
                currentClue: state.current_clue,
                boardCards: state.board_cards,
                selectedCardWords: state.selected_card_words,
                revealedCardWords: state.revealed_card_words,
                roundState: state.round_state,
                roundResultMessage: state.round_result_message,
                roundResolutionStartedAtMs: state.round_resolution_started_at_ms,
                roundResolutionBeatMs: state.round_resolution_beat_ms,
                roundNumber: state.round_number,
                nextStepHint: state.next_step_hint,
                teamAScore: state.team_a_score,
                teamBScore: state.team_b_score,
                gameScoreTarget: state.game_score_target,
                winningTeamKey: state.winning_team_key,
                gameEndMessage: state.game_end_message,
                currentClueAuthorParticipantId: state.current_clue_author_participant_id,
                clueWithdrawAllowed: state.clue_withdraw_allowed,
              }
            : current,
        );
        setStartBlockedReasons(state.blocked_reasons);
        setHostAbsenceGraceUntilMs(state.host_absence_grace_until_ms ?? null);
        if (participantId) {
          setIsHost(participantId === state.host_participant_id);
          const role = state.participant_roles[participantId];
          if (state.phase === "pre_game") {
            setJoinCapacity("lobby");
          } else {
            setJoinCapacity(role ? "player" : "spectator");
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger l'etat de la salle.";
        setErrorMessage(message);
      }
    };
    void loadRoomState();
    if (!roomCode) {
      return;
    }
    const pollingId = globalThis.setInterval(() => {
      void loadRoomState();
    }, 2000);
    return () => {
      globalThis.clearInterval(pollingId);
    };
  }, [roomCode, megaDeckWords.length, joinedStatus, participantId]);

  useEffect(() => {
    turnStateRef.current = turnState;
  }, [turnState]);

  const isSpectator = joinCapacity === "spectator";

  useEffect(() => {
    if (!roomCode || roomPhase !== "in_game") {
      setLiveEventsMode("idle");
      wsHadOpenedInEffectRef.current = false;
      return;
    }

    const websocketBaseUrl = API_BASE_URL.replace("http://", "ws://").replace(
      "https://",
      "wss://",
    );
    const wsParams = new URLSearchParams();
    wsParams.set("correlation_id", crypto.randomUUID());
    if (participantId != null && participantId !== "") {
      wsParams.set("participant_id", participantId);
    }
    const wsUrl = `${websocketBaseUrl}/rooms/${roomCode.trim().toUpperCase()}/events?${wsParams.toString()}`;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
    let attempts = 0;
    let gaveUp = false;
    const maxAttempts = 24;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as {
        type: string;
        payload: {
          phase?: string;
          active_participant_id: string | null;
          active_role: string | null;
          current_clue?: string | null;
          board_cards?: string[];
          selected_card_words?: string[];
          revealed_card_words?: string[];
          round_state?: string;
          round_result_message?: string | null;
          round_resolution_started_at_ms?: number | null;
          round_resolution_beat_ms?: number;
          round_number?: number;
          next_step_hint?: string | null;
          team_a_score?: number;
          team_b_score?: number;
          game_score_target?: number;
          winning_team_key?: string | null;
          game_end_message?: string | null;
          current_clue_author_participant_id?: string | null;
          clue_withdraw_allowed?: boolean;
          host_participant_id?: string | null;
          host_absence_grace_until_ms?: number | null;
          participants?: { participant_id: string; pseudo: string }[];
        };
        version: number;
      };
      if (
        data.type !== "turn_snapshot" &&
        data.type !== "turn_changed" &&
        data.type !== "clue_submitted" &&
        data.type !== "clue_withdrawn" &&
        data.type !== "participant_left" &&
        data.type !== "participant_joined" &&
        data.type !== "card_selection_changed" &&
        data.type !== "cards_revealed" &&
        data.type !== "round_resolution_started" &&
        data.type !== "round_resolution_cleared" &&
        data.type !== "game_finished" &&
        data.type !== "host_absence_grace_started" &&
        data.type !== "host_absence_grace_cleared" &&
        data.type !== "host_transferred_passive"
      ) {
        return;
      }
      const eventKey = `${roomCode}:${data.type}:${data.version}`;
      if (seenEventKeysRef.current.has(eventKey)) {
        return;
      }
      seenEventKeysRef.current.add(eventKey);
      if (seenEventKeysRef.current.size > 200) {
        seenEventKeysRef.current.clear();
      }
      const current = turnStateRef.current;
      if (data.version < current.version) {
        return;
      }
      if (data.version > current.version + 1) {
        setSyncMessage("Desynchronisation detectee. Resynchronisation de l'etat en cours.");
      } else {
        setSyncMessage(null);
      }
      if (data.payload.phase !== undefined) {
        setRoomPhase(data.payload.phase);
      }
      setTurnState({
        version: data.version,
        activeParticipantId: data.payload.active_participant_id,
        activeRole: data.payload.active_role,
        currentClue:
          data.payload.current_clue !== undefined
            ? data.payload.current_clue
            : current.currentClue,
        boardCards:
          data.payload.board_cards !== undefined
            ? data.payload.board_cards
            : current.boardCards,
        selectedCardWords:
          data.payload.selected_card_words !== undefined
            ? data.payload.selected_card_words
            : current.selectedCardWords,
        revealedCardWords:
          data.payload.revealed_card_words !== undefined
            ? data.payload.revealed_card_words
            : current.revealedCardWords,
        roundState:
          data.payload.round_state !== undefined ? data.payload.round_state : current.roundState,
        roundResultMessage:
          data.payload.round_result_message !== undefined
            ? data.payload.round_result_message
            : current.roundResultMessage,
        roundResolutionStartedAtMs:
          data.payload.round_resolution_started_at_ms !== undefined
            ? data.payload.round_resolution_started_at_ms
            : current.roundResolutionStartedAtMs,
        roundResolutionBeatMs:
          data.payload.round_resolution_beat_ms !== undefined
            ? data.payload.round_resolution_beat_ms
            : current.roundResolutionBeatMs,
        roundNumber:
          data.payload.round_number !== undefined ? data.payload.round_number : current.roundNumber,
        nextStepHint:
          data.payload.next_step_hint !== undefined
            ? data.payload.next_step_hint
            : current.nextStepHint,
        teamAScore:
          data.payload.team_a_score !== undefined
            ? data.payload.team_a_score
            : current.teamAScore,
        teamBScore:
          data.payload.team_b_score !== undefined
            ? data.payload.team_b_score
            : current.teamBScore,
        gameScoreTarget:
          data.payload.game_score_target !== undefined
            ? data.payload.game_score_target
            : current.gameScoreTarget,
        winningTeamKey:
          data.payload.winning_team_key !== undefined
            ? data.payload.winning_team_key
            : current.winningTeamKey,
        gameEndMessage:
          data.payload.game_end_message !== undefined
            ? data.payload.game_end_message
            : current.gameEndMessage,
        currentClueAuthorParticipantId:
          data.payload.current_clue_author_participant_id !== undefined
            ? data.payload.current_clue_author_participant_id
            : current.currentClueAuthorParticipantId,
        clueWithdrawAllowed:
          data.payload.clue_withdraw_allowed !== undefined
            ? data.payload.clue_withdraw_allowed
            : current.clueWithdrawAllowed,
      });
      if (data.payload.host_absence_grace_until_ms !== undefined) {
        setHostAbsenceGraceUntilMs(data.payload.host_absence_grace_until_ms ?? null);
      }
      if (
        data.payload.host_participant_id !== undefined &&
        participantId
      ) {
        setIsHost(participantId === data.payload.host_participant_id);
      }
      if (
        data.type === "cards_revealed" &&
        data.payload.revealed_card_words &&
        data.version > lastLiveRevealVersionRef.current &&
        data.payload.revealed_card_words.length > current.revealedCardWords.length
      ) {
        const revealedNowCount =
          data.payload.revealed_card_words.length - current.revealedCardWords.length;
        const message = `${revealedNowCount} carte(s) revelee(s).`;
        setRevealAnnouncement(message);
        pushToast(message);
        lastLiveRevealVersionRef.current = data.version;
      }
      if (data.type === "round_resolution_started" && data.payload.round_result_message) {
        pushToast("Fin de manche synchronisee.");
      }
      if (data.type === "game_finished" && data.payload.game_end_message) {
        pushToast("Partie terminee — consultez le tableau des scores.");
      }
      if (data.type === "host_absence_grace_started") {
        pushToast(
          "Connexion de l'hote au flux temps reel interrompue — transfert automatique possible apres la grace.",
        );
      }
      if (data.type === "host_absence_grace_cleared") {
        pushToast(
          "L'hote s'est reconnecte au flux temps reel — transfert automatique annule.",
        );
      }
      if (data.type === "host_transferred_passive") {
        pushToast(
          "Nouvel hote — la connexion temps reel de l'hote precedent etait interrompue.",
        );
      }
    };

    const connect = () => {
      if (cancelled || gaveUp) {
        return;
      }
      socket = new WebSocket(wsUrl);
      socket.onmessage = handleMessage;
      socket.onopen = () => {
        if (cancelled) {
          return;
        }
        attempts = 0;
        setLiveEventsMode("connected");
        if (wsHadOpenedInEffectRef.current) {
          pushToast("Connexion temps reel retablie.");
        }
        wsHadOpenedInEffectRef.current = true;
      };
      socket.onerror = () => {
        socket?.close();
      };
      socket.onclose = () => {
        if (cancelled || gaveUp) {
          return;
        }
        attempts += 1;
        if (attempts > maxAttempts) {
          gaveUp = true;
          setLiveEventsMode("paused");
          pushToast(
            "Temps reel indisponible — synchronisation par rafraîchissement automatique.",
          );
          return;
        }
        setLiveEventsMode("reconnecting");
        reconnectTimer = globalThis.setTimeout(
          connect,
          Math.min(8000, 400 + attempts * 400),
        );
      };
    };

    connect();

    return () => {
      cancelled = true;
      globalThis.clearTimeout(reconnectTimer);
      wsHadOpenedInEffectRef.current = false;
      socket?.close();
    };
  }, [roomCode, roomPhase, participantId, pushToast]);

  useEffect(() => {
    if (turnState.roundState !== "round_resolution" || !turnState.roundResolutionStartedAtMs) {
      return;
    }
    const timer = globalThis.setInterval(() => {
      setRoundResolutionBeatTick((n) => n + 1);
    }, 250);
    return () => globalThis.clearInterval(timer);
  }, [
    turnState.roundState,
    turnState.roundResolutionStartedAtMs,
    turnState.roundResolutionBeatMs,
  ]);

  useEffect(() => {
    if (
      hostAbsenceGraceUntilMs === null ||
      Date.now() >= hostAbsenceGraceUntilMs
    ) {
      return;
    }
    const timer = globalThis.setInterval(() => {
      setHostGraceBannerTick((n) => n + 1);
    }, 500);
    return () => globalThis.clearInterval(timer);
  }, [hostAbsenceGraceUntilMs]);

  void roundResolutionBeatTick;
  const roundBeatRemainingMs =
    turnState.roundState !== "round_resolution" || !turnState.roundResolutionStartedAtMs
      ? 0
      : Math.max(
          0,
          turnState.roundResolutionBeatMs -
            (Date.now() - turnState.roundResolutionStartedAtMs),
        );

  const liveTransportBanner =
    liveEventsMode === "reconnecting"
      ? "Connexion temps reel interrompue — reconnexion en cours. L'indicateur de tour suit le serveur (mise a jour HTTP)."
      : liveEventsMode === "paused"
        ? "Temps reel suspendu — synchronisation automatique activee. La partie continue pour tous les joueurs."
        : null;

  void hostGraceBannerTick;
  const hostGraceRemainingMs =
    hostAbsenceGraceUntilMs !== null && Date.now() < hostAbsenceGraceUntilMs
      ? Math.max(0, hostAbsenceGraceUntilMs - Date.now())
      : 0;

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
        <div className="app-mode-switch" role="tablist" aria-label="Mode application">
          <button
            type="button"
            role="tab"
            aria-selected={appShell === "multi"}
            className={appShell === "multi" ? undefined : "btn-secondary"}
            onClick={() => setAppShell("multi")}
            data-testid="multi-mode-tab"
          >
            Multijoueur
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={appShell === "solo"}
            className={appShell === "solo" ? undefined : "btn-secondary"}
            onClick={() => setAppShell("solo")}
            data-testid="solo-mode-tab"
          >
            Apprentissage solo
          </button>
        </div>
        {appShell === "solo" ? (
          <SoloLearning onExit={() => setAppShell("multi")} />
        ) : (
          <>
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
        {supportDiagnosticRef ? (
          <p className="muted support-diagnostic-ref" data-testid="support-diagnostic-ref">
            Reference diagnostic (support, optionnelle):{" "}
            <code>{supportDiagnosticRef}</code>
          </p>
        ) : null}
        {roomCode ? (
          <section className="room-header" aria-label="Etat de la salle">
            <p className="muted">
              Phase courante:{" "}
              {roomPhase === "in_game"
                ? "en jeu"
                : roomPhase === "game_over"
                  ? "partie terminee"
                  : "pre-partie"}
            </p>
            {participantId && isSpectator ? (
              <p role="status" className="spectator-banner" data-testid="spectator-banner">
                {joinStatusDetail ??
                  "Spectateur — vous observez la partie sans actions sur la grille ni les tours."}
              </p>
            ) : null}
            {roomPhase === "in_game" && hostGraceRemainingMs > 0 ? (
              <p
                role="status"
                className="host-absence-banner"
                aria-live="polite"
                data-testid="host-absence-banner"
              >
                Connexion temps reel de l'hote au flux interrompue. Si elle ne revient pas
                avant la fin du delai, un autre joueur deviendra hote automatiquement. Temps restant
                env. {Math.ceil(hostGraceRemainingMs / 1000)} s.
              </p>
            ) : null}
            {isHost ? <p className="muted">Role: hote</p> : null}
            {participantId ? (
              <button
                type="button"
                className="btn-secondary"
                data-testid="leave-room-button"
                disabled={isLeavingRoom}
                onClick={() => {
                  void handleLeaveRoom();
                }}
              >
                {isLeavingRoom ? "Sortie..." : "Quitter la salle"}
              </button>
            ) : null}
            {roomPhase === "in_game" || roomPhase === "game_over" ? (
              <section className="scoreboard" aria-label="Scores par equipe">
                <div
                  className={
                    roomPhase === "game_over" && turnState.winningTeamKey === "team_a"
                      ? "score-pill score-team-a score-winner"
                      : "score-pill score-team-a"
                  }
                >
                  <span className="score-label">Equipe A</span>
                  <span className="score-value" data-testid="score-team-a">
                    {turnState.teamAScore}
                  </span>
                  <span className="score-meta">/ {turnState.gameScoreTarget}</span>
                </div>
                <div
                  className={
                    roomPhase === "game_over" && turnState.winningTeamKey === "team_b"
                      ? "score-pill score-team-b score-winner"
                      : "score-pill score-team-b"
                  }
                >
                  <span className="score-label">Equipe B</span>
                  <span className="score-value" data-testid="score-team-b">
                    {turnState.teamBScore}
                  </span>
                  <span className="score-meta">/ {turnState.gameScoreTarget}</span>
                </div>
              </section>
            ) : null}
            {roomPhase === "game_over" ? (
              <section
                className="game-result-panel"
                aria-labelledby="game-result-title"
                role="region"
              >
                <h2 id="game-result-title">Resultat de partie</h2>
                <p className="game-end-message" data-testid="game-end-message">
                  {turnState.gameEndMessage ??
                    "Partie terminee. Les scores ci-dessus refletent l'etat serveur."}
                </p>
                {turnState.winningTeamKey === "tie" ? (
                  <p className="muted">Issue: match nul.</p>
                ) : null}
              </section>
            ) : null}
            {roomPhase === "in_game" ? (
              <section className="turn-indicator">
                {liveTransportBanner || syncMessage ? (
                  <div
                    className="sync-banner"
                    role="status"
                    aria-live="polite"
                    data-testid="sync-banner"
                  >
                    {liveTransportBanner ? <p>{liveTransportBanner}</p> : null}
                    {syncMessage ? <p>{syncMessage}</p> : null}
                  </div>
                ) : null}
                <p>
                  Manche {turnState.roundNumber} - Tour v{turnState.version}: joueur actif{" "}
                  {turnState.activeParticipantId ?? "inconnu"} (
                  {turnState.activeRole ?? "role inconnu"})
                </p>
                {turnState.roundState === "round_resolution" ? (
                  <section className="round-resolution-panel" aria-live="polite">
                    <p>{turnState.roundResultMessage ?? "Fin de manche."}</p>
                    <p className="muted">
                      Beat de cloture: {Math.ceil(roundBeatRemainingMs / 1000)}s avant transition.
                    </p>
                    {isHost && turnState.nextStepHint === "next_round" ? (
                      <>
                        <button
                          type="button"
                          onClick={handleContinueRound}
                          disabled={isContinuingRound || roundBeatRemainingMs > 0}
                          aria-describedby={
                            roundContinueRiskFeedback ? "round-continue-risk-feedback" : undefined
                          }
                          data-testid="continue-round-button"
                        >
                          {isContinuingRound ? "Transition..." : "Lancer la manche suivante"}
                        </button>
                        {roundContinueRiskFeedback ? (
                          <p
                            id="round-continue-risk-feedback"
                            className="risk-inline-feedback"
                            role="alert"
                            data-testid="round-continue-risk-feedback"
                          >
                            {roundContinueRiskFeedback}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="muted">En attente de l'hote pour la manche suivante.</p>
                    )}
                  </section>
                ) : null}
                <button
                  type="button"
                  onClick={handleAdvanceTurn}
                  disabled={
                    isAdvancingTurn ||
                    isSpectator ||
                    turnState.activeParticipantId !== participantId
                  }
                  aria-describedby={turnRiskFeedback ? "turn-risk-feedback" : undefined}
                >
                  {isAdvancingTurn ? "Changement..." : "Passer au tour suivant"}
                </button>
                {turnRiskFeedback ? (
                  <p id="turn-risk-feedback" className="risk-inline-feedback" role="alert">
                    {turnRiskFeedback}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleRevealCards}
                  disabled={
                    isRevealingCards ||
                    isSpectator ||
                    turnState.activeParticipantId !== participantId ||
                    !(turnState.activeRole || "").startsWith("guesser_") ||
                    turnState.selectedCardWords.length === 0 ||
                    !turnState.currentClue ||
                    turnState.roundState === "round_resolution"
                  }
                  aria-describedby={revealRiskFeedback ? "reveal-risk-feedback" : undefined}
                  data-testid="reveal-selection-button"
                >
                  {isRevealingCards ? "Revelation..." : "Reveler la selection"}
                </button>
                {revealRiskFeedback ? (
                  <p
                    id="reveal-risk-feedback"
                    className="risk-inline-feedback"
                    role="alert"
                    data-testid="reveal-risk-feedback"
                  >
                    {revealRiskFeedback}
                  </p>
                ) : null}
                <p id="reveal-no-undo-hint" className="muted reveal-irreversible-hint">
                  La revelation est definitive en V1 — sans annulation.
                </p>
                <section className="clue-composer" aria-labelledby="clue-composer-title">
                  <h3 id="clue-composer-title">ClueComposer</h3>
                  <label htmlFor="clue-input">Indice</label>
                  <input
                    id="clue-input"
                    name="clue-input"
                    value={clueInput}
                    onChange={(event) => setClueInput(event.target.value)}
                    maxLength={24}
                    aria-describedby={clueErrorMessage ? "clue-help clue-error clue-counter" : "clue-help clue-counter"}
                    aria-invalid={Boolean(clueErrorMessage)}
                    autoComplete="off"
                  />
                  <p id="clue-help" className="muted">
                    2 a 24 caracteres, lettres/espace/tiret uniquement.
                  </p>
                  <p id="clue-counter" className="muted" aria-live="polite">
                    {24 - clueInput.length} caracteres restants.
                  </p>
                  {clueErrorMessage ? (
                    <p id="clue-error" className="error-message" role="alert">
                      {clueErrorMessage}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSubmitClue}
                    disabled={
                      isSubmittingClue ||
                      isSpectator ||
                      turnState.activeParticipantId !== participantId ||
                      !(turnState.activeRole || "").startsWith("clue_giver_")
                    }
                  >
                    {isSubmittingClue ? "Validation..." : "Valider l'indice"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => void handleWithdrawClue()}
                    disabled={
                      isWithdrawingClue ||
                      isSpectator ||
                      !turnState.clueWithdrawAllowed ||
                      participantId !== turnState.currentClueAuthorParticipantId ||
                      turnState.roundState === "round_resolution"
                    }
                    title={
                      turnState.roundState === "round_resolution"
                        ? "Fin de manche — retrait suspendu."
                        : !turnState.currentClue
                          ? undefined
                          : !turnState.clueWithdrawAllowed
                            ? "Non disponible : la selection a ete touchee ou la revelation a eu lieu."
                            : participantId !== turnState.currentClueAuthorParticipantId
                              ? "Reserve a l'auteur de l'indice."
                              : undefined
                    }
                    data-testid="withdraw-clue-button"
                  >
                    {isWithdrawingClue ? "Retrait..." : "Retirer l'indice"}
                  </button>
                  {turnState.currentClue ? (
                    <p className="muted">Indice actif: {turnState.currentClue}</p>
                  ) : null}
                  {!turnState.clueWithdrawAllowed &&
                  turnState.currentClue &&
                  participantId === turnState.currentClueAuthorParticipantId ? (
                    <p className="muted" id="clue-withdraw-blocked-hint">
                      Retrait d'indice indisponible apres interaction devineur ou revelation.
                    </p>
                  ) : null}
                </section>
                <div className="sr-only-live" role="status" aria-live="polite" aria-atomic="true">
                  {revealAnnouncement}
                </div>
                {toastMessages.length > 0 ? (
                  <section
                    className="toast-stack"
                    aria-label="Notifications de partie"
                    aria-live="assertive"
                  >
                    {toastMessages.map((toast, index) => (
                      <p key={`${toast}-${index}`} className="toast-message">
                        {toast}
                      </p>
                    ))}
                  </section>
                ) : null}
                <p id="selection-toggle-hint" className="muted">
                  Pour corriger une selection, appuyez de nouveau sur la meme carte.
                </p>
                {selectionRiskFeedback ? (
                  <p
                    id="selection-risk-feedback"
                    className="risk-inline-feedback"
                    role="alert"
                    data-testid="selection-risk-feedback"
                  >
                    {selectionRiskFeedback}
                  </p>
                ) : null}
                <section className="word-grid" aria-label="WordGrid">
                  {turnState.boardCards.map((cardWord, index) => {
                    const isSelected = turnState.selectedCardWords.includes(cardWord);
                    const isRevealed = turnState.revealedCardWords.includes(cardWord);
                    const isSelectionAllowed =
                      !isSpectator &&
                      turnState.activeParticipantId === participantId &&
                      (turnState.activeRole || "").startsWith("guesser_");
                    return (
                      <button
                        key={cardWord}
                        type="button"
                        className={
                          isRevealed
                            ? "word-card revealed"
                            : isSelected
                              ? "word-card selected"
                              : "word-card"
                        }
                        data-testid={`word-card-${index}`}
                        aria-pressed={isSelected}
                        aria-describedby={isRevealed ? "revealed-hint" : undefined}
                        onClick={() => void handleToggleCard(cardWord)}
                        disabled={!isSelectionAllowed || isRevealed}
                      >
                        {cardWord}
                      </button>
                    );
                  })}
                </section>
                <p id="revealed-hint" className="muted">
                  Les cartes revelees sont verrouillees pour le reste du round.
                </p>
              </section>
            ) : null}
          </section>
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
        {roomCode && roomPhase === "pre_game" ? (
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
            {isHost ? (
              <div className="start-panel">
                <button
                  type="button"
                  onClick={handleStartGame}
                  disabled={isStartingGame || startBlockedReasons.length > 0}
                >
                  {isStartingGame ? "Demarrage..." : "Demarrer la partie"}
                </button>
                {startBlockedReasons.length > 0 ? (
                  <div>
                    {startBlockedReasons.map((reason) => (
                      <p key={reason} className="muted">
                        Demarrage bloque: {reason}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="muted">Seul l'hote peut demarrer la partie.</p>
            )}
            <section className="team-setup-panel" aria-labelledby="team-setup-title">
              <h3 id="team-setup-title">TeamSetup - Variante P0</h3>
              <p className="muted">
                Variante active: {variantKey} (regles fixes V1 appliquees cote serveur).
              </p>
              <label htmlFor="teams-count">Nombre d'equipes</label>
              <input
                id="teams-count"
                name="teams-count"
                value={variantTeamsCount}
                disabled
                readOnly
              />
              <label htmlFor="grid-size">Taille de grille</label>
              <input id="grid-size" name="grid-size" value={`${variantGridSize}x${variantGridSize}`} disabled readOnly />
              <label htmlFor="black-words">Mots noirs</label>
              <input id="black-words" name="black-words" value={variantBlackWords} disabled readOnly />
              <p className="muted">
                Cette variante P0 verrouille la configuration (2 equipes, grille 5x5, 1 mot noir).
              </p>
              <p className="muted">Roles P0 initialises: {participantRolesCount}</p>
            </section>
          </section>
        ) : null}
        {joinedStatus ? <p className="room-code">{joinedStatus}</p> : null}
        {errorMessage ? (
          <p className="error-message" role="alert">
            {errorMessage}
          </p>
        ) : null}
          </>
        )}
        <section className="ai-assist-panel" aria-labelledby="ai-assist-title">
          <h2 id="ai-assist-title">Assist IA (session navigateur)</h2>
          <p className="muted">
            Opt-in par session — desactive par defaut. Aucune cle API dans le bundle web (NFR-S2) ;
            configuration uniquement cote serveur.{" "}
            <a
              href="#transparence-ia"
              className="inline-legal-link"
              aria-label="Transparence — usage de l'IA (lien depuis le panneau assist)"
            >
              En savoir plus
            </a>
          </p>
          <label className="ai-assist-toggle">
            <input
              type="checkbox"
              checked={aiAssistPrefEnabled}
              onChange={(event) => handleAiAssistPrefChange(event.target.checked)}
              data-testid="ai-assist-pref-checkbox"
            />
            Activer la preference assist IA pour cet onglet
          </label>
          <div className="ai-assist-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void handleRefreshAiAssistStatus()}
              disabled={aiAssistStatusLoading}
              data-testid="ai-assist-status-button"
            >
              {aiAssistStatusLoading ? "Chargement..." : "Actualiser statut serveur"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void handlePingAiAssist()}
              disabled={aiAssistPingLoading}
              data-testid="ai-assist-ping-button"
            >
              {aiAssistPingLoading ? "Verification..." : "Verifier disponibilite assist"}
            </button>
          </div>
          {aiAssistServerMessage ? (
            <>
              <p className="ai-origin-indicator" role="note" data-testid="ai-assist-origin-note">
                <span className="ai-origin-chip">Assist IA</span>
                <span>
                  Diagnostic serveur (canal assist V1) — ne modifie pas directement la grille ni les
                  tours.
                </span>
              </p>
              <p className="muted ai-assist-server-msg" role="status" data-testid="ai-assist-message">
                {aiAssistServerMessage}
              </p>
            </>
          ) : null}
        </section>
        <footer className="legal-footer" aria-label="Liens legaux">
          <a href="#cgu">CGU</a>
          <a href="#risques-contenu">Risques contenu</a>
          <a href="#transparence-ia">Transparence IA</a>
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
        <section
          id="transparence-ia"
          className="legal-panel"
          aria-labelledby="transparence-ia-title"
        >
          <h2 id="transparence-ia-title">Transparence — usage de l'IA (V1)</h2>
          <p>
            <strong>Perimetre.</strong> Les fonctions d'assist IA sont{" "}
            <strong>optionnelles</strong>. Le multijoueur et le mode apprentissage solo restent{" "}
            <strong>pleinement jouables sans IA</strong>. En V1, le panneau « Assist IA » sert surtout
            a <strong>verifier</strong> si le serveur expose un canal assist configure ; ce n'est pas
            une promesse de fonctionnalites avancees dans la grille.
          </p>
          <p>
            <strong>Traitement.</strong> Aucune cle fournisseur n'est incluse dans le site web ou le
            bundle telecharge par le navigateur. Une cle eventuelle reste{" "}
            <strong>uniquement cote serveur API</strong>. La case « preference assist » est stockee
            dans la <strong>session du navigateur</strong> (fermeture d'onglet : la preference est
            oubliee).
          </p>
          <p>
            <strong>Limitations.</strong> Si des fonctions IA sont offertes plus tard, elles peuvent
            etre <strong>indisponibles</strong>, <strong>lentes</strong> ou{" "}
            <strong>imprecises</strong>. Le produit est concu pour{" "}
            <strong>degrader sans bloquer</strong> la partie : messages clairs, jeu nominal sans IA.
          </p>
          <p className="muted">
            Les retours affiches apres « Actualiser statut » ou « Verifier disponibilite » portent la
            pastille <strong>Assist IA</strong> : il s'agit d'informations de diagnostic serveur, pas
            de suggestions integrees aux cartes ou aux scores tant que la spec produit ne prevoit pas
            cette couche.
          </p>
        </section>
        <section id="a-propos" className="legal-panel" aria-labelledby="about-title">
          <h2 id="about-title">A propos</h2>
          <p>Version du build: {APP_VERSION}</p>
          <p className="muted">
            Notes: socle MVP multijoueur + apprentissage solo, legal et jointure de salle.
          </p>
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
