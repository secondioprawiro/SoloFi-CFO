// x402 payment config — OKX Payment SDK, used to bill A2MCP calls to /mcp.
// Degrades gracefully: if OKX_API_KEY/OKX_SECRET_KEY/OKX_PASSPHRASE aren't set yet
// (a separate OKX Developer Portal credential from OKX_AI_API_KEY/OKX_AI_AGENT_ID),
// x402Enabled is false and index.ts skips mounting the payment middleware — /mcp
// then just serves for free instead of crashing the boot.

import { OKXFacilitatorClient } from '@okxweb3/x402-core';
import { ExactEvmScheme } from '@okxweb3/x402-evm/exact/server';
import type { Network, SchemeRegistration } from '@okxweb3/x402-express';
import { env } from '../config/env.js';
import { agentAccount } from './web3.config.js';

export const X402_NETWORK: Network = env.xLayer.chainId === 196 ? 'eip155:196' : 'eip155:1952';

export const x402Enabled = Boolean(env.okxPayment.apiKey && env.okxPayment.secretKey && env.okxPayment.passphrase);

export const facilitatorClient = x402Enabled
  ? new OKXFacilitatorClient({
      apiKey: env.okxPayment.apiKey,
      secretKey: env.okxPayment.secretKey,
      passphrase: env.okxPayment.passphrase,
    })
  : undefined;

export const x402Schemes: SchemeRegistration[] = [{ network: X402_NETWORK, server: new ExactEvmScheme() }];

// Falls back to the agent wallet's own address (same wallet used for invoices/splits)
// so a separate payout address isn't required for the demo.
export const payToAddress = env.okxPayment.payToAddress || agentAccount?.address;
