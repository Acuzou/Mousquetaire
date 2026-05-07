import { describe, expect, it } from "vitest";

import { ApiRequestError, parseFastApiDetail } from "./apiErrors";

describe("parseFastApiDetail", () => {
  it("extrait message et error_code du detail objet FastAPI", async () => {
    const response = new Response(
      JSON.stringify({
        detail: { error_code: "not_your_turn", message: "Ce n'est pas votre tour d'agir." },
      }),
      { status: 403 },
    );
    await expect(parseFastApiDetail(response)).resolves.toEqual({
      message: "Ce n'est pas votre tour d'agir.",
      errorCode: "not_your_turn",
    });
  });

  it("produit un message generique pour corps invalide", async () => {
    const response = new Response("not json", { status: 500 });
    await expect(parseFastApiDetail(response)).resolves.toEqual({
      message: "Erreur serveur (500). Reessayez dans un instant.",
    });
  });
});

describe("ApiRequestError", () => {
  it("expose status et errorCode", () => {
    const err = new ApiRequestError("msg", 409, "turn_version_conflict");
    expect(err.message).toBe("msg");
    expect(err.status).toBe(409);
    expect(err.errorCode).toBe("turn_version_conflict");
  });
});
