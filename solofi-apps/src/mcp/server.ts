// MCP (Model Context Protocol) adapter for OKX.AI's A2MCP integration mode.
//
// OKX's ASP dev-docs (web3.okx.com/onchainos/dev-docs/okxai/howtomcp) confirm an
// ASP's compliant endpoint is a real MCP server (they link out to Cloudflare's
// "remote MCP server" guide) rather than a bespoke webhook — so this exposes the
// same four SoloFi CFO intents as MCP tools, calling the same domain services
// used by webhook.controller.ts + AiService (Gemini path stays as-is for the
// judged demo; this is the spec-compliant path for real ASP registration).
//
// NOTE: OKX's docs never published how a caller's identity is carried on an MCP
// tools/call request (no auth-context example was reachable). Every tool below
// takes an explicit `user_wallet` argument as the best-guess contract, mirroring
// the same wallet -> user mapping webhook.controller.ts uses via
// UserRepository.findOrCreateByWallet. Isolated to this one file so it's a small
// change once OKX's real auth-context shape is confirmed.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { InvoiceService } from '../services/InvoiceService.js';
import type { PocketService } from '../services/PocketService.js';
import type { AdvisorService } from '../services/AdvisorService.js';

export function createSoloFiMcpServer(
  userRepository: UserRepository,
  invoiceService: InvoiceService,
  pocketService: PocketService,
  advisorService: AdvisorService,
): McpServer {
  const server = new McpServer({ name: 'solofi-cfo', version: '0.1.0' });

  server.registerTool(
    'createInvoice',
    {
      description: 'Create a new crypto invoice for a client and return payment instructions.',
      inputSchema: {
        user_wallet: z.string().describe("Caller's Agentic Wallet address"),
        client_name: z.string().describe('Name of the client being invoiced'),
        amount: z.number().positive().describe('Invoice amount'),
        currency: z.string().describe('Token symbol, e.g. USDC, USDT'),
      },
    },
    async ({ user_wallet, client_name, amount, currency }) => {
      const user = await userRepository.findOrCreateByWallet(user_wallet);
      const { invoice, receivingWallet } = await invoiceService.createInvoice(user.id, client_name, amount, currency);
      return {
        content: [
          {
            type: 'text',
            text: `Invoice #${invoice.id.slice(0, 8).toUpperCase()} created. Ask ${client_name} to send ${amount} ${currency} to ${receivingWallet}.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    'setPocketRule',
    {
      description:
        'Define or replace the automatic fund-allocation rules ("pockets") for a user. Percentages must sum to 100.',
      inputSchema: {
        user_wallet: z.string().describe("Caller's Agentic Wallet address"),
        rules: z
          .array(
            z.object({
              name: z.string().describe('Pocket name, e.g. Operational, Personal, Emergency Fund'),
              wallet_address: z.string().describe('Destination wallet address for this pocket'),
              percentage: z.number().min(0).max(100).describe('Percentage of incoming funds allocated to this pocket'),
            }),
          )
          .describe('List of pocket allocation rules'),
      },
    },
    async ({ user_wallet, rules }) => {
      const user = await userRepository.findOrCreateByWallet(user_wallet);
      const saved = await pocketService.setPocketRules(user.id, rules);
      const summary = saved.map((r) => `${r.percentage}% -> ${r.name} (${r.wallet_address})`).join(', ');
      return { content: [{ type: 'text', text: `Pocket rules saved: ${summary}.` }] };
    },
  );

  server.registerTool(
    'queryBalance',
    {
      description: 'Get the current balance of a specific pocket, or all pockets if none specified.',
      inputSchema: {
        user_wallet: z.string().describe("Caller's Agentic Wallet address"),
        pocket_name: z.string().optional().describe('Name of the pocket to query. Omit to get all pockets.'),
      },
    },
    async ({ user_wallet, pocket_name }) => {
      const user = await userRepository.findOrCreateByWallet(user_wallet);
      const reply = await advisorService.queryBalance(user.id, pocket_name);
      return { content: [{ type: 'text', text: reply }] };
    },
  );

  server.registerTool(
    'queryCashflow',
    {
      description: 'Get a natural-language cashflow summary for the given period.',
      inputSchema: {
        user_wallet: z.string().describe("Caller's Agentic Wallet address"),
        period: z.enum(['week', 'month']).describe('Reporting period'),
      },
    },
    async ({ user_wallet, period }) => {
      const user = await userRepository.findOrCreateByWallet(user_wallet);
      const reply = await advisorService.queryCashflow(user.id, period);
      return { content: [{ type: 'text', text: reply }] };
    },
  );

  return server;
}
