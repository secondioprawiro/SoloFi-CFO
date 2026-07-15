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
    // sb_secret_... key (Supabase's new API key system) — replaces the legacy service_role key.
    secretKey: optional('SUPABASE_SECRET_KEY'),
  },

  xLayer: {
    rpcUrl: optional('X_LAYER_RPC_URL', 'https://testrpc.xlayer.tech'),
    chainId: Number(optional('X_LAYER_CHAIN_ID', '1952')),
    agentWalletPrivateKey: optional('AGENT_WALLET_PRIVATE_KEY'),
    tokens: {
      USDC: optional('USDC_ADDRESS'),
      USDT: optional('USDT_ADDRESS'),
    },
  },

  // OKX Payment SDK (x402) facilitator credentials — from the OKX Developer Portal,
  // NOT the same as OKX_AI_API_KEY/OKX_AI_AGENT_ID (those are ASP marketplace identity).
  okxPayment: {
    apiKey: optional('OKX_API_KEY'),
    secretKey: optional('OKX_SECRET_KEY'),
    passphrase: optional('OKX_PASSPHRASE'),
    price: optional('X402_PRICE', '$0.20'),
    payToAddress: optional('X402_PAY_TO_ADDRESS'),
  },
} as const;

export { required };
