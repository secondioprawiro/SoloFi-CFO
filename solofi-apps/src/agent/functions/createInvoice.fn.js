// LLM function definition — createInvoice
// TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / OKX.AI)

export const createInvoiceFn = {
  name: 'createInvoice',
  description: 'Create a new crypto invoice for a client and return payment instructions.',
  parameters: {
    type: 'object',
    properties: {
      client_name: { type: 'string', description: 'Name of the client being invoiced' },
      amount: { type: 'number', description: 'Invoice amount' },
      currency: { type: 'string', description: 'Token symbol, e.g. USDC, USDT' },
    },
    required: ['client_name', 'amount', 'currency'],
  },
};
