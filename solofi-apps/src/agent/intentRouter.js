// intentRouter — terima pesan user, panggil LLM dengan function definitions, route ke service yang tepat
// TODO: pilih LLM provider (OpenAI function calling / OKX.AI built-in model)

import { SYSTEM_PROMPT } from './prompts/systemPrompt.js';
import { createInvoiceFn } from './functions/createInvoice.fn.js';
import { setPocketRuleFn } from './functions/setPocketRule.fn.js';
import { queryBalanceFn } from './functions/queryBalance.fn.js';
import { queryCashflowFn } from './functions/queryCashflow.fn.js';

const FUNCTION_DEFINITIONS = [createInvoiceFn, setPocketRuleFn, queryBalanceFn, queryCashflowFn];

/**
 * @param {string} userMessage
 * @param {string} userId
 */
export async function routeIntent(userMessage, userId) {
  // 1. TODO: call LLM with SYSTEM_PROMPT + FUNCTION_DEFINITIONS + userMessage
  // 2. TODO: parse function call response (name + arguments)
  // 3. TODO: route to appropriate service based on function name:
  //    - createInvoice   -> InvoiceService.createInvoice()
  //    - setPocketRule   -> PocketService.setPocketRules()
  //    - queryBalance    -> AdvisorService.queryBalance()
  //    - queryCashflow   -> AdvisorService.queryCashflow()
  // 4. TODO: format dan return response ke user

  throw new Error('routeIntent: not implemented — TODO wire LLM provider');
}
