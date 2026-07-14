// AiService — Gemini prompts, Tool Use / Function Calling, and routing to domain services.

import { GoogleGenerativeAI, type FunctionCall } from '@google/generative-ai';
import { env } from '../config/env.js';
import { SYSTEM_PROMPT } from '../agent/prompts/systemPrompt.js';
import { FUNCTION_DECLARATIONS } from '../agent/functions/index.js';
import type { InvoiceService } from './InvoiceService.js';
import type { PocketService } from './PocketService.js';
import type { AdvisorService } from './AdvisorService.js';

const MODEL_NAME = 'gemini-1.5-flash';

export class AiService {
  private readonly genAI = new GoogleGenerativeAI(env.gemini.apiKey);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly pocketService: PocketService,
    private readonly advisorService: AdvisorService,
  ) {}

  async handleMessage(userMessage: string, userId: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
    });

    const result = await model.generateContent(userMessage);
    const calls = result.response.functionCalls();

    if (!calls || calls.length === 0) {
      return result.response.text();
    }

    return this.dispatch(calls[0], userId);
  }

  private async dispatch(call: FunctionCall, userId: string): Promise<string> {
    const args = call.args as Record<string, unknown>;

    switch (call.name) {
      case 'createInvoice': {
        const { invoice, receivingWallet } = await this.invoiceService.createInvoice(
          userId,
          String(args.client_name),
          Number(args.amount),
          String(args.currency),
        );
        return `Invoice #${invoice.id.slice(0, 8).toUpperCase()} created. Ask ${invoice.client_name} to send ${invoice.amount} ${invoice.currency} to ${receivingWallet}.`;
      }

      case 'setPocketRule': {
        const rules = args.rules as { name: string; wallet_address: string; percentage: number }[];
        await this.pocketService.setPocketRules(userId, rules);
        const summary = rules.map((r) => `${r.percentage}% → ${r.name} (${r.wallet_address})`).join(', ');
        return `Got it — pocket rules saved: ${summary}.`;
      }

      case 'queryBalance': {
        const pocketName = args.pocket_name ? String(args.pocket_name) : undefined;
        return this.advisorService.queryBalance(userId, pocketName);
      }

      case 'queryCashflow': {
        const period = args.period === 'month' ? 'month' : 'week';
        return this.advisorService.queryCashflow(userId, period);
      }

      default:
        return `I understood a request I don't know how to handle yet ("${call.name}").`;
    }
  }
}
