// LLM function definition — queryCashflow
// TODO: sesuaikan format schema dengan LLM provider yang dipilih (OpenAI tools / OKX.AI)

export const queryCashflowFn = {
  name: 'queryCashflow',
  description: 'Get a natural-language cashflow summary for the given period.',
  parameters: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['week', 'month'], description: 'Reporting period' },
    },
    required: ['period'],
  },
};
