// Entry point — SoloFi CFO agent backend.
// No frontend: this process only exists to receive OKX.AI ASP webhooks, resolve
// intent via Gemini function calling, execute the resulting on-chain/DB actions,
// and reply in OKX.AI's expected JSON shape.

import express from 'express';
import { env } from './config/env.js';

import { UserRepository } from './repositories/UserRepository.js';
import { InvoiceRepository } from './repositories/InvoiceRepository.js';
import { PocketRepository } from './repositories/PocketRepository.js';
import { TransactionLogRepository } from './repositories/TransactionLogRepository.js';

import { Web3Service } from './services/Web3Service.js';
import { PocketService } from './services/PocketService.js';
import { AdvisorService } from './services/AdvisorService.js';
import { InvoiceService } from './services/InvoiceService.js';
import { AiService } from './services/AiService.js';
import { OkxNotifier } from './services/OkxNotifier.js';

import { createWebhookController } from './controllers/webhook.controller.js';

function bootstrap() {
  const userRepository = new UserRepository();
  const invoiceRepository = new InvoiceRepository();
  const pocketRepository = new PocketRepository();
  const transactionLogRepository = new TransactionLogRepository();

  const web3Service = new Web3Service();
  const pocketService = new PocketService(pocketRepository, transactionLogRepository, web3Service);
  const advisorService = new AdvisorService(pocketRepository, transactionLogRepository, web3Service);
  const okxNotifier = new OkxNotifier();

  // Wires Pilar 1 → Pilar 2 → Pilar 4: payment detected -> auto-split -> proactive notification.
  const invoiceService = new InvoiceService(invoiceRepository, web3Service, async (invoice, txHash) => {
    const transfers = await pocketService.executeSplit(invoice.user_id, invoice.id, invoice.amount, invoice.currency, txHash);
    const summary = transfers.map((t) => `${t.amount} ${invoice.currency} → ${t.name}`).join(', ');
    await okxNotifier.sendProactiveMessage(
      invoice.user_id,
      `💥 Payment confirmed — ${invoice.amount} ${invoice.currency} from ${invoice.client_name} received and split: ${summary}.`,
    );
  });

  const aiService = new AiService(invoiceService, pocketService, advisorService);

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/webhook', createWebhookController(aiService, userRepository));

  app.listen(env.port, () => {
    console.log(`SoloFi CFO agent listening on port ${env.port} (${env.nodeEnv})`);
  });
}

bootstrap();
