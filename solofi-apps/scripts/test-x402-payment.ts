// Standalone script — proves the x402 payment flow end-to-end against the live
// /mcp endpoint: hits it unpaid, gets a real 402 challenge, signs a real payment
// authorization with the agent wallet, resends with X-PAYMENT, and reports the result.
//
// Run: npx tsx scripts/test-x402-payment.ts
//
// Uses AGENT_WALLET_PRIVATE_KEY as the payer — the same wallet is both payer and
// payTo here (self-payment), which is fine for proving the protocol works; a real
// OKX.AI caller would use its own funded wallet instead.

import 'dotenv/config';
import { createWalletClient, createPublicClient, http, publicActions, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { x402Client, x402HTTPClient } from '@okxweb3/x402-core/client';
import { registerExactEvmScheme } from '@okxweb3/x402-evm/exact/client';
import { toClientEvmSigner } from '@okxweb3/x402-evm';

const MCP_URL = process.env.MCP_URL ?? 'https://solofi-cfo3-production.up.railway.app/mcp';
const PRIVATE_KEY = process.env.AGENT_WALLET_PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
  console.error('AGENT_WALLET_PRIVATE_KEY not set in .env');
  process.exit(1);
}

const xLayerTestnet = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: [process.env.X_LAYER_RPC_URL ?? 'https://testrpc.xlayer.tech'] } },
});

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: xLayerTestnet,
    transport: http(),
  }).extend(publicActions);
  const publicClient = createPublicClient({ chain: xLayerTestnet, transport: http() });
  const signer = toClientEvmSigner(
    { address: account.address, signTypedData: (msg) => walletClient.signTypedData(msg as never) },
    publicClient,
  );

  console.log(`Payer wallet: ${account.address}`);
  console.log(`Target: ${MCP_URL}\n`);

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'createInvoice',
      arguments: { user_wallet: account.address, client_name: 'x402 Demo Client', amount: 42, currency: 'USDC' },
    },
  });

  console.log('--- Step 1: unpaid request (expect 402) ---');
  const firstResponse = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body,
  });
  console.log(`Status: ${firstResponse.status}`);

  if (firstResponse.status !== 402) {
    console.log('Did not receive 402 — x402 may be disabled or the request already succeeded.');
    console.log(await firstResponse.text());
    return;
  }

  const paymentRequiredHeader = firstResponse.headers.get('payment-required');
  if (!paymentRequiredHeader) {
    console.error('402 received but no payment-required header found.');
    return;
  }

  const paymentRequired = JSON.parse(Buffer.from(paymentRequiredHeader, 'base64').toString('utf-8'));
  console.log('Decoded challenge:', JSON.stringify(paymentRequired, null, 2));

  console.log('\n--- Step 2: sign payment authorization ---');
  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  const httpClient = new x402HTTPClient(client);

  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  console.log('Payment payload created (signed).');

  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  console.log('\n--- Step 3: resend with X-PAYMENT header ---');
  const secondResponse = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...paymentHeaders,
    },
    body,
  });

  console.log(`Status: ${secondResponse.status}`);
  const responseText = await secondResponse.text();
  console.log('Response body:', responseText);

  if (secondResponse.ok) {
    console.log('\n✅ x402 payment accepted — tool call succeeded end-to-end.');
  } else {
    console.log('\n❌ Payment was rejected or settlement failed — see response above.');
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
