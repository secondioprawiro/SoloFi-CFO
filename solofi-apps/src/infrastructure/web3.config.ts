// Web3 config — X Layer network + viem clients shared by Web3Service.

import { createPublicClient, createWalletClient, http, defineChain, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '../config/env.js';

const isTestnet = env.xLayer.chainId !== 196;

export const xLayer = defineChain({
  id: env.xLayer.chainId,
  name: isTestnet ? 'X Layer Testnet' : 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: [env.xLayer.rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: 'X Layer Explorer',
      url: isTestnet ? 'https://www.oklink.com/xlayer-test' : 'https://www.oklink.com/xlayer',
    },
  },
});

export const publicClient = createPublicClient({
  chain: xLayer,
  transport: http(env.xLayer.rpcUrl),
});

// Only instantiate an account/wallet client when a valid key is configured — lets
// the service boot in read-only mode (e.g. local dev without a funded agent
// wallet, or with a placeholder key not yet filled in) instead of crashing.
function loadAgentAccount() {
  if (!env.xLayer.agentWalletPrivateKey) return undefined;
  try {
    return privateKeyToAccount(env.xLayer.agentWalletPrivateKey as `0x${string}`);
  } catch (err) {
    console.warn(
      `[web3.config] AGENT_WALLET_PRIVATE_KEY is set but invalid (${(err as Error).message}) — ` +
        'booting in read-only mode. On-chain writes (transfers, invoice watching) will fail until fixed.',
    );
    return undefined;
  }
}

export const agentAccount = loadAgentAccount();

export const walletClient = agentAccount
  ? createWalletClient({
      account: agentAccount,
      chain: xLayer,
      transport: http(env.xLayer.rpcUrl),
    })
  : undefined;

export const TOKEN_ADDRESSES: Record<string, Address | undefined> = {
  USDC: env.xLayer.tokens.USDC as Address | undefined,
  USDT: env.xLayer.tokens.USDT as Address | undefined,
};

// Minimal ERC-20 ABI — just what SoloFi CFO needs (balance reads, transfers, Transfer event watch).
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;
