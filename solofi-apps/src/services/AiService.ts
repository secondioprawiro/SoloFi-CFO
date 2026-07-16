// AiService — Gemini prompts, Tool Use / Function Calling, and routing to domain services.

import { GoogleGenerativeAI, type FunctionCall, type GenerateContentResult } from '@google/generative-ai';
import { env } from '../config/env.js';
import { SYSTEM_PROMPT } from '../agent/prompts/systemPrompt.js';
import { FUNCTION_DECLARATIONS } from '../agent/functions/index.js';
import type { InvoiceService } from './InvoiceService.js';
import type { PocketService } from './PocketService.js';
import type { AdvisorService } from './AdvisorService.js';

// Free-tier quota (RPD) is per-model, not shared — if one model's daily quota
// is exhausted, try the next rather than failing the whole request. Ordered by
// preference; keep all entries on the free tier (never add a paid-only model).
const MODEL_CANDIDATES = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.0-flash-lite'];

export class AiService {
  private readonly genAI = new GoogleGenerativeAI(env.gemini.apiKey);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly pocketService: PocketService,
    private readonly advisorService: AdvisorService,
  ) {}

  async handleMessage(userMessage: string, userId: string): Promise<string> {
    const result = await this.generateWithFallback(userMessage);
    const calls = result.response.functionCalls();

    if (!calls || calls.length === 0) {
      return result.response.text();
    }

    return this.dispatch(calls[0], userId);
  }

  // Free-tier daily quota is per-model. On a quota error (429), fall through
  // to the next candidate model instead of failing the request; on any other
  // (transient 5xx) error, retry the same model once before moving on.
  private async generateWithFallback(userMessage: string): Promise<GenerateContentResult> {
    let lastError: unknown;

    for (const modelName of MODEL_CANDIDATES) {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      });

      try {
        return await model.generateContent(userMessage);
      } catch (err) {
        lastError = err;
        const isQuotaError = err instanceof Error && /429|quota/i.test(err.message);
        if (isQuotaError) {
          console.warn(`[AiService] ${modelName} quota exhausted, trying next candidate:`, err);
          continue;
        }
        console.warn(`[AiService] ${modelName} failed, retrying once:`, err);
        try {
          return await model.generateContent(userMessage);
        } catch (retryErr) {
          lastError = retryErr;
          console.warn(`[AiService] ${modelName} failed again, trying next candidate:`, retryErr);
        }
      }
    }

    throw lastError;
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
