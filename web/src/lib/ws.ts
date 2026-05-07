export type WsEventEnvelope<TPayload = unknown> = {
  type: string;
  payload: TPayload;
  version: number;
};
