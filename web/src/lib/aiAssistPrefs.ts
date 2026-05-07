const SESSION_KEY = "mousquetaire_ai_assist_pref_enabled";

/** Opt-in session — jeu nominal sans IA (FR19). */
export function readAiAssistSessionPref(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw === null) {
      return false;
    }
    return raw === "1";
  } catch {
    return false;
  }
}

export function writeAiAssistSessionPref(enabled: boolean): void {
  try {
    sessionStorage.setItem(SESSION_KEY, enabled ? "1" : "0");
  } catch {
    /* quota / navigation privee */
  }
}
