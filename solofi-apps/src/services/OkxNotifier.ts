// OkxNotifier — sends proactive chat messages back to OKX.AI (e.g. "payment received & split").
//
// TODO: confirm the real outbound endpoint + auth scheme once OKX's ASP dev docs
// (web3.okx.com/onchainos/dev-docs/okxai/...) are reachable — this environment could
// not load them (network denied). `OKX_AI_CALLBACK_URL` is a placeholder env var.

import { env } from '../config/env.js';

export class OkxNotifier {
  async sendProactiveMessage(userId: string, message: string): Promise<void> {
    const callbackUrl = process.env.OKX_AI_CALLBACK_URL;
    if (!callbackUrl) {
      console.warn(`[OkxNotifier] OKX_AI_CALLBACK_URL not set — skipping proactive message: "${message}"`);
      return;
    }

    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.okx.apiKey}`,
      },
      body: JSON.stringify({ userId, agentId: env.okx.agentId, message }),
    });

    if (!response.ok) {
      console.error(`[OkxNotifier] proactive notification failed: ${response.status} ${await response.text()}`);
    }
  }
}
