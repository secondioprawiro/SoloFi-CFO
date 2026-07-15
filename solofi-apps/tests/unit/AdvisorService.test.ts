import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AdvisorService } from '../../src/services/AdvisorService.js';
import { FakePocketRepository, FakeTransactionLogRepository, FakeWeb3Service } from '../support/fakes.js';

function makeService() {
  const pocketRepository = new FakePocketRepository();
  const transactionLogRepository = new FakeTransactionLogRepository();
  const web3Service = new FakeWeb3Service();
  const advisorService = new AdvisorService(pocketRepository as any, transactionLogRepository as any, web3Service as any);
  return { advisorService, pocketRepository, transactionLogRepository, web3Service };
}

test('queryBalance reports "no pockets" when the user has not set any up', async () => {
  const { advisorService } = makeService();

  const reply = await advisorService.queryBalance('user-1');

  assert.match(reply, /don't have any pockets/);
});

test('queryBalance returns a not-found message for an unknown pocket name', async () => {
  const { advisorService, pocketRepository } = makeService();
  await pocketRepository.saveRules('user-1', [{ name: 'Operations', wallet_address: '0xop', percentage: 100 }]);

  const reply = await advisorService.queryBalance('user-1', 'Vacation');

  assert.match(reply, /couldn't find a pocket named "Vacation"/);
});

test('queryBalance formats on-chain balances for each matching pocket', async () => {
  const { advisorService, pocketRepository, web3Service } = makeService();
  await pocketRepository.saveRules('user-1', [
    { name: 'Operations', wallet_address: '0xop', percentage: 50 },
    { name: 'Personal', wallet_address: '0xpersonal', percentage: 50 },
  ]);
  web3Service.balances.set('0xop', 123.456);
  web3Service.balances.set('0xpersonal', 10);

  const reply = await advisorService.queryBalance('user-1');

  assert.equal(reply, 'Operations: 123.46 USDC, Personal: 10.00 USDC');
});

test('queryCashflow reports "no income" when no RECEIVE logs exist in the period', async () => {
  const { advisorService } = makeService();

  const reply = await advisorService.queryCashflow('user-1', 'week');

  assert.match(reply, /No income recorded in the last week/);
});

test('queryCashflow summarizes total received and total split for the period', async () => {
  const { advisorService, transactionLogRepository } = makeService();

  await transactionLogRepository.log({
    userId: 'user-1',
    txHash: '0xpay',
    fromAddress: 'external',
    toAddress: '0xagent',
    amount: 100,
    currency: 'USDC',
    action: 'RECEIVE',
  });
  await transactionLogRepository.log({
    userId: 'user-1',
    txHash: '0xsplit1',
    fromAddress: '0xagent',
    toAddress: '0xop',
    amount: 60,
    currency: 'USDC',
    action: 'SPLIT',
  });
  await transactionLogRepository.log({
    userId: 'user-1',
    txHash: '0xsplit2',
    fromAddress: '0xagent',
    toAddress: '0xpersonal',
    amount: 40,
    currency: 'USDC',
    action: 'SPLIT',
  });

  const reply = await advisorService.queryCashflow('user-1', 'week');

  assert.match(reply, /received 100\.00 across 1 payment\(s\)/);
  assert.match(reply, /split 100\.00 into your pockets/);
});
