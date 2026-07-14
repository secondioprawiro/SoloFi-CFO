// OKX.AI ASP (Agent Service Provider) webhook contract.
//
// NOTE: OKX.AI's ASP integration is actually built around "Onchain OS" (an agent
// installed via `npx skills add okx/onchainos-skills`) and an A2A / A2MCP
// marketplace model — not a plain webhook-in/webhook-out chat API as originally
// assumed. The exact wire format lives in OKX's dev docs
// (web3.okx.com/onchainos/dev-docs/okxai/...), which were not reachable from this
// environment. The shape below is a reasonable best guess based on the public
// okx.ai/tutorial/asp overview and is deliberately isolated behind
// `controllers/webhook.controller.ts` so it's a one-file change once the real
// contract is confirmed.

export interface OkxWebhookPayload {
  userId: string;
  sessionId?: string;
  message: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export interface OkxWebhookResponse {
  reply: string;
  metadata?: Record<string, unknown>;
}
