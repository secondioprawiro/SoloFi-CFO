// LLM function definition — queryBalance
// TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / OKX.AI)

export const queryBalanceFn = {
  name: 'queryBalance',
  description: 'Get the current balance of a specific pocket, or all pockets if none specified.',
  parameters: {
    type: 'object',
    properties: {
      pocket_name: { type: 'string', description: 'Name of the pocket to query. Omit to get all pockets.' },
    },
    required: [],
  },
};
