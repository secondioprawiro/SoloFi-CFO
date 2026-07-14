// Web3 config — X Layer network + viem clients shared by Web3Service.

import { createPublicClient, createWalletClient, http, defineChain, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from '../config/env.js';

export const xLayer = defineChain({
  id: env.xLayer.chainId,
  name: 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: [env.xLayer.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'X Layer Explorer', url: 'https://www.oklink.com/xlayer' },
  },
});

export const publicClient = createPublicClient({
  chain: xLayer,
  transport: http(env.xLayer.rpcUrl),
});

// Only instantiate an account/wallet client when a key is configured — lets the
// service boot in read-only mode (e.g. local dev without a funded agent wallet).
export const agentAccount = env.xLayer.agentWalletPrivateKey
  ? privateKeyToAccount(env.xLayer.agentWalletPrivateKey as `0x${string}`)
  : undefined;

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
