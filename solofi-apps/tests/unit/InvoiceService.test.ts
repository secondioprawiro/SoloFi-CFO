import { test } from 'node:test';
import assert from 'node:assert/strict';

import { InvoiceService } from '../../src/services/InvoiceService.js';
import { FakeInvoiceRepository, FakeWeb3Service } from '../support/fakes.js';
import type { Invoice } from '../../src/types/invoice.types.js';

function makeService() {
  const invoiceRepository = new FakeInvoiceRepository();
  const web3Service = new FakeWeb3Service();
  const detected: { invoice: Invoice; txHash: string }[] = [];
  const invoiceService = new InvoiceService(
    invoiceRepository as any,
    web3Service as any,
    async (invoice, txHash) => {
      detected.push({ invoice, txHash });
    },
  );
  return { invoiceService, invoiceRepository, web3Service, detected };
}

test('createInvoice persists a PENDING invoice and returns the agent wallet as receiving address', async () => {
  const { invoiceService, web3Service } = makeService();

  const { invoice, receivingWallet } = await invoiceService.createInvoice('user-1', 'Client Alpha', 100, 'USDC');

  assert.equal(invoice.status, 'PENDING');
  assert.equal(invoice.client_name, 'Client Alpha');
  assert.equal(invoice.amount, 100);
  assert.equal(receivingWallet, web3Service.agentAddress);
});

test('createInvoice registers a payment watcher for the exact invoice amount/currency', async () => {
  const { invoiceService, web3Service } = makeService();

  await invoiceService.createInvoice('user-1', 'Client Alpha', 100, 'USDC');

  assert.equal(web3Service.watchers.length, 1);
  assert.equal(web3Service.watchers[0].expectedAmount, 100);
  assert.equal(web3Service.watchers[0].currency, 'USDC');
});

test('a detected payment marks the invoice PAID and fires the onPaymentDetected callback', async () => {
  const { invoiceService, web3Service, detected } = makeService();

  const { invoice, receivingWallet } = await invoiceService.createInvoice('user-1', 'Client Alpha', 100, 'USDC');
  const txHash = await web3Service.simulateIncomingPayment(receivingWallet, 100, 'USDC');

  assert.equal(detected.length, 1);
  assert.equal(detected[0].txHash, txHash);
  assert.equal(detected[0].invoice.id, invoice.id);
  assert.equal(detected[0].invoice.status, 'PAID');
  assert.equal(detected[0].invoice.payment_tx_hash, txHash);
});

test('markAsPaid delegates to the repository', async () => {
  const { invoiceService, invoiceRepository } = makeService();
  const { invoice } = await invoiceService.createInvoice('user-1', 'Client Alpha', 50, 'USDC');

  const updated = await invoiceService.markAsPaid(invoice.id, '0xdirect');

  assert.equal(updated.status, 'PAID');
  assert.equal((await invoiceRepository.findById(invoice.id))?.payment_tx_hash, '0xdirect');
});

test('getPendingInvoices only returns PENDING invoices for that user', async () => {
  const { invoiceService, web3Service } = makeService();

  await invoiceService.createInvoice('user-1', 'Client A', 10, 'USDC');
  const { invoice: paidInvoice, receivingWallet } = await invoiceService.createInvoice('user-1', 'Client B', 20, 'USDC');
  await web3Service.simulateIncomingPayment(receivingWallet, 20, 'USDC');
  await invoiceService.createInvoice('user-2', 'Client C', 30, 'USDC');

  const pending = await invoiceService.getPendingInvoices('user-1');

  assert.equal(pending.length, 1);
  assert.equal(pending[0].amount, 10);
  assert.notEqual(pending[0].id, paidInvoice.id);
});
