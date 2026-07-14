// Entry point — SoloFi CFO agent backend
// TODO: pilih HTTP framework (Express / Fastify / Hono) sesuai keputusan tim
// TODO: wire up webhook route dari OKX.AI -> intentRouter

import 'dotenv/config';
import { routeIntent } from './agent/intentRouter.js';

async function main() {
  // TODO: start HTTP server dan daftarkan route src/api/webhook.js
  console.log('SoloFi CFO agent starting...');
}

main().catch((err) => {
  console.error('Fatal error starting SoloFi CFO:', err);
  process.exit(1);
});

export { routeIntent };
