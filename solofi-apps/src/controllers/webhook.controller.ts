// Webhook controller — parses the incoming OKX.AI ASP payload and returns a
// response in the JSON shape OKX.AI expects. See src/types/okx.types.ts for the
// caveat on why this shape is a best-effort assumption pending OKX's dev docs.

import { Router, type Request, type Response } from 'express';
import type { AiService } from '../services/AiService.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { OkxWebhookPayload, OkxWebhookResponse } from '../types/okx.types.js';

export function createWebhookController(aiService: AiService, userRepository: UserRepository): Router {
  const router = Router();

  router.post('/okx', async (req: Request, res: Response) => {
    const payload = req.body as Partial<OkxWebhookPayload>;

    if (!payload || typeof payload.userId !== 'string' || typeof payload.message !== 'string') {
      return res.status(400).json({ error: 'Invalid payload: "userId" and "message" are required.' });
    }

    try {
      // MVP: OKX's userId is treated as the user's wallet identifier (Agentic
      // Wallet login model) and mapped 1:1 to our internal `users` row.
      const user = await userRepository.findOrCreateByWallet(payload.userId);
      const reply = await aiService.handleMessage(payload.message, user.id);

      const response: OkxWebhookResponse = { reply };
      res.json(response);
    } catch (err) {
      console.error('[webhook.controller] error handling OKX message:', err);
      res.status(500).json({ error: 'Internal error processing message.' });
    }
  });

  return router;
}
