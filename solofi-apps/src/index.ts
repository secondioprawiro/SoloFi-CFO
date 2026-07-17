// Entry point — SoloFi CFO agent backend.
// No frontend: this process only exists to receive OKX.AI ASP webhooks, resolve
// intent via Gemini function calling, execute the resulting on-chain/DB actions,
// and reply in OKX.AI's expected JSON shape.

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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
import { createSoloFiMcpServer } from './mcp/server.js';
import { paymentMiddlewareFromConfig } from '@okxweb3/x402-express';
import { x402Enabled, facilitatorClient, x402Schemes, X402_NETWORK, payToAddress } from './infrastructure/x402.config.js';

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
  // Railway sits behind a proxy — without this, req.protocol always reads
  // 'http' even on real https requests, which the x402 middleware bakes into
  // the challenge's resource.url, mismatching the actual https endpoint and
  // failing OKX's x402 standard validation.
  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/webhook', createWebhookController(aiService, userRepository));

  // x402 billing for the A2MCP endpoint — degrades to free if the OKX Payment
  // SDK facilitator credentials (OKX_API_KEY/OKX_SECRET_KEY/OKX_PASSPHRASE, from
  // the OKX Developer Portal — separate from OKX_AI_API_KEY/OKX_AI_AGENT_ID)
  // aren't configured yet, so the server still boots and /mcp still works.
  if (x402Enabled && payToAddress) {
    const x402Middleware = paymentMiddlewareFromConfig(
      {
        '/mcp': {
          accepts: {
            scheme: 'exact',
            network: X402_NETWORK,
            payTo: payToAddress,
            price: env.okxPayment.price,
          },
          description: 'SoloFi CFO — Invoice & Cashflow Agent (A2MCP)',
          mimeType: 'application/json',
        },
      },
      facilitatorClient,
      x402Schemes,
    );
    // MCP handshake methods (initialize, tools/list, ping, notifications/*)
    // must succeed unpaid — any standard MCP client, including OKX's own
    // agent, calls these before it ever reaches a billable tools/call. Gating
    // the whole /mcp path uniformly breaks that handshake and looks like a
    // non-responding agent to platform testing (confirmed: OKX rejected the
    // ASP listing with "unable to receive a response... task timed out").
    app.use((req, res, next) => {
      if (req.path === '/mcp' && req.body?.method === 'tools/call') {
        return x402Middleware(req, res, next);
      }
      next();
    });
  } else {
    console.warn(
      '[x402] payment middleware disabled — OKX_API_KEY/OKX_SECRET_KEY/OKX_PASSPHRASE not configured (or no agent wallet for payTo). /mcp is serving free of charge.',
    );
  }

  // OKX.AI A2MCP path: real MCP server, stateless (one server+transport per call,
  // no session tracking) since our four tools are each independent deterministic
  // requests — matches OKX's "free endpoint" A2MCP model.
  app.post('/mcp', async (req, res) => {
    const mcpServer = createSoloFiMcpServer(userRepository, invoiceService, pocketService, advisorService);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      mcpServer.close();
    });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.listen(env.port, () => {
    console.log(`SoloFi CFO agent listening on port ${env.port} (${env.nodeEnv})`);
  });
}

bootstrap();
