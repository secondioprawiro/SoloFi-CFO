// LLM function definition — setPocketRule
// TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / OKX.AI)

export const setPocketRuleFn = {
  name: 'setPocketRule',
  description: 'Define or replace the automatic fund-allocation rules ("pockets") for a user. Percentages must sum to 100.',
  parameters: {
    type: 'object',
    properties: {
      rules: {
        type: 'array',
        description: 'List of pocket allocation rules',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Pocket name, e.g. Operational, Personal, Emergency Fund' },
            wallet_address: { type: 'string', description: 'Destination wallet address for this pocket' },
            percentage: { type: 'number', description: 'Percentage of incoming funds allocated to this pocket (0-100)' },
          },
          required: ['name', 'wallet_address', 'percentage'],
        },
      },
    },
    required: ['rules'],
  },
};
