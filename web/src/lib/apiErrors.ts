/** Erreur HTTP API avec message utilisateur et code métier optionnel (FastAPI detail). */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

export type ParsedFastApiDetail = {
  message: string;
  errorCode?: string;
};

export async function parseFastApiDetail(response: Response): Promise<ParsedFastApiDetail> {
  const raw = (await response.json().catch(() => null)) as unknown;
  const detail = (raw as { detail?: unknown })?.detail;

  if (typeof detail === "object" && detail !== null && !Array.isArray(detail)) {
    const obj = detail as { message?: unknown; error_code?: unknown };
    const message = typeof obj.message === "string" ? obj.message : null;
    const errorCode = typeof obj.error_code === "string" ? obj.error_code : undefined;
    if (message) {
      return { message, errorCode };
    }
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown };
    if (typeof first?.msg === "string") {
      return { message: "Requete invalide. Verifiez les champs saisis." };
    }
  }

  return {
    message: `Erreur serveur (${response.status}). Reessayez dans un instant.`,
  };
}

export async function throwIfApiFailed(response: Response, fallbackMessage: string): Promise<void> {
  if (response.ok) {
    return;
  }
  const { message, errorCode } = await parseFastApiDetail(response);
  throw new ApiRequestError(message || fallbackMessage, response.status, errorCode);
}
