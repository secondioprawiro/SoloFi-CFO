// Simulates Demo Scenario 3 end-to-end (see docs/DEMO_SCRIPT.md) without a real
// Supabase project or X Layer RPC: create invoice -> simulate on-chain payment ->
// auto-split into pockets -> proactive notification -> queryCashflow reflects it.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { InvoiceService } from '../../src/services/InvoiceService.js';
import { PocketService } from '../../src/services/PocketService.js';
import { AdvisorService } from '../../src/services/AdvisorService.js';
import {
  FakeInvoiceRepository,
  FakePocketRepository,
  FakeTransactionLogRepository,
  FakeWeb3Service,
} from '../support/fakes.js';

test('payment received on X Layer triggers invoice PAID + pocket split + queryable cashflow', async () => {
  const invoiceRepository = new FakeInvoiceRepository();
  const pocketRepository = new FakePocketRepository();
  const transactionLogRepository = new FakeTransactionLogRepository();
  const web3Service = new FakeWeb3Service();

  const notifications: string[] = [];
  const pocketService = new PocketService(pocketRepository as any, transactionLogRepository as any, web3Service as any);
  const advisorService = new AdvisorService(pocketRepository as any, transactionLogRepository as any, web3Service as any);
  const invoiceService = new InvoiceService(invoiceRepository as any, web3Service as any, async (invoice, txHash) => {
    const transfers = await pocketService.executeSplit(invoice.user_id, invoice.id, invoice.amount, invoice.currency, txHash);
    notifications.push(`Payment confirmed: ${invoice.amount} ${invoice.currency} split into ${transfers.length} pockets.`);
  });

  await pocketService.setPocketRules('user-1', [
    { name: 'Operations', wallet_address: '0xop', percentage: 50 },
    { name: 'Personal', wallet_address: '0xpersonal', percentage: 30 },
    { name: 'Emergency Fund', wallet_address: '0xemergency', percentage: 20 },
  ]);

  const { invoice, receivingWallet } = await invoiceService.createInvoice('user-1', 'Client Alpha', 100, 'USDC');
  assert.equal(invoice.status, 'PENDING');

  await web3Service.simulateIncomingPayment(receivingWallet, 100, 'USDC');

  const updatedInvoice = await invoiceService.getInvoicesByUser('user-1');
  assert.equal(updatedInvoice[0].status, 'PAID');
  assert.equal(notifications.length, 1);
  assert.match(notifications[0], /split into 3 pockets/);

  const cashflow = await advisorService.queryCashflow('user-1', 'week');
  assert.match(cashflow, /received 100\.00 across 1 payment\(s\)/);
  assert.match(cashflow, /split 100\.00 into your pockets/);
});

test('two pending invoices with the same amount/currency race onto the oldest match (known MVP limitation)', async () => {
  const invoiceRepository = new FakeInvoiceRepository();
  const web3Service = new FakeWeb3Service();
  const invoiceService = new InvoiceService(invoiceRepository as any, web3Service as any, async () => {});

  const first = await invoiceService.createInvoice('user-1', 'Client A', 100, 'USDC');
  const second = await invoiceService.createInvoice('user-1', 'Client B', 100, 'USDC');

  const match = await invoiceRepository.findOldestPendingMatch(100, 'USDC');

  assert.equal(match?.id, first.invoice.id, 'oldest pending invoice should match first, not the newer duplicate-amount one');
  assert.notEqual(match?.id, second.invoice.id);
});
