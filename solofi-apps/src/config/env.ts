// Centralized environment config — read once, validate presence of hard requirements
// at startup instead of scattering `process.env.X` (and silent undefineds) across the codebase.

import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Fail fast at boot rather than deep inside a request handler.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  port: Number(optional('PORT', '3000')),
  nodeEnv: optional('NODE_ENV', 'development'),

  okx: {
    apiKey: optional('OKX_AI_API_KEY'),
    agentId: optional('OKX_AI_AGENT_ID'),
  },

  gemini: {
    apiKey: optional('GEMINI_API_KEY'),
  },

  supabase: {
    url: optional('SUPABASE_URL'),
    serviceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY'),
  },

  xLayer: {
    rpcUrl: optional('X_LAYER_RPC_URL', 'https://rpc.xlayer.tech'),
    chainId: Number(optional('X_LAYER_CHAIN_ID', '196')),
    agentWalletPrivateKey: optional('AGENT_WALLET_PRIVATE_KEY'),
    tokens: {
      USDC: optional('USDC_ADDRESS'),
      USDT: optional('USDT_ADDRESS'),
    },
  },
} as const;

export { required };
