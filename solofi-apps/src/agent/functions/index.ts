// Gemini Tool Use / Function Calling declarations for SoloFi CFO's four intents.
// See https://ai.google.dev/gemini-api/docs/function-calling for the schema shape.

import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';

export const createInvoiceFn: FunctionDeclaration = {
  name: 'createInvoice',
  description: 'Create a new crypto invoice for a client and return payment instructions.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      client_name: { type: SchemaType.STRING, description: 'Name of the client being invoiced' },
      amount: { type: SchemaType.NUMBER, description: 'Invoice amount' },
      currency: { type: SchemaType.STRING, description: 'Token symbol, e.g. USDC, USDT' },
    },
    required: ['client_name', 'amount', 'currency'],
  },
};

export const setPocketRuleFn: FunctionDeclaration = {
  name: 'setPocketRule',
  description:
    'Define or replace the automatic fund-allocation rules ("pockets") for a user. Percentages must sum to 100.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      rules: {
        type: SchemaType.ARRAY,
        description: 'List of pocket allocation rules',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'Pocket name, e.g. Operational, Personal, Emergency Fund' },
            wallet_address: { type: SchemaType.STRING, description: 'Destination wallet address for this pocket' },
            percentage: {
              type: SchemaType.NUMBER,
              description: 'Percentage of incoming funds allocated to this pocket (0-100)',
            },
          },
          required: ['name', 'wallet_address', 'percentage'],
        },
      },
    },
    required: ['rules'],
  },
};

export const queryBalanceFn: FunctionDeclaration = {
  name: 'queryBalance',
  description: 'Get the current balance of a specific pocket, or all pockets if none specified.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      pocket_name: { type: SchemaType.STRING, description: 'Name of the pocket to query. Omit to get all pockets.' },
    },
    required: [],
  },
};

export const queryCashflowFn: FunctionDeclaration = {
  name: 'queryCashflow',
  description: 'Get a natural-language cashflow summary for the given period.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      period: { type: SchemaType.STRING, format: 'enum', enum: ['week', 'month'], description: 'Reporting period' },
    },
    required: ['period'],
  },
};

export const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  createInvoiceFn,
  setPocketRuleFn,
  queryBalanceFn,
  queryCashflowFn,
];
