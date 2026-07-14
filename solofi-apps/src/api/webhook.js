// webhook — terima event/message dari OKX.AI dan forward ke intentRouter
// TODO: pilih HTTP framework (Express / Fastify / Hono) dan implementasikan route handler

import { routeIntent } from '../agent/intentRouter.js';

/**
 * Example handler signature — adjust to chosen framework's request/response shape.
 * @param {{ userId: string, message: string }} payload
 */
export async function handleOkxWebhook(payload) {
  const { userId, message } = payload;
  // TODO: validate payload shape (userId, message required)
  const response = await routeIntent(message, userId);
  // TODO: return response in the shape OKX.AI expects
  return response;
}
