import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PocketService } from '../../src/services/PocketService.js';
import { FakePocketRepository, FakeTransactionLogRepository, FakeWeb3Service } from '../support/fakes.js';

function makeService() {
  const pocketRepository = new FakePocketRepository();
  const transactionLogRepository = new FakeTransactionLogRepository();
  const web3Service = new FakeWeb3Service();
  const pocketService = new PocketService(pocketRepository as any, transactionLogRepository as any, web3Service as any);
  return { pocketService, pocketRepository, transactionLogRepository, web3Service };
}

test('setPocketRules accepts rules that sum to exactly 100%', async () => {
  const { pocketService } = makeService();

  const rules = [
    { name: 'Operations', wallet_address: '0xop', percentage: 50 },
    { name: 'Personal', wallet_address: '0xpersonal', percentage: 30 },
    { name: 'Emergency Fund', wallet_address: '0xemergency', percentage: 20 },
  ];

  const saved = await pocketService.setPocketRules('user-1', rules);

  assert.equal(saved.length, 3);
});

test('setPocketRules rejects rules that do not sum to 100%', async () => {
  const { pocketService } = makeService();

  const rules = [
    { name: 'Operations', wallet_address: '0xop', percentage: 50 },
    { name: 'Personal', wallet_address: '0xpersonal', percentage: 30 },
  ];

  await assert.rejects(() => pocketService.setPocketRules('user-1', rules), /must sum to 100/);
});

test('setPocketRules tolerates floating point rounding (33.33 + 33.33 + 33.34)', async () => {
  const { pocketService } = makeService();

  const rules = [
    { name: 'A', wallet_address: '0xa', percentage: 33.33 },
    { name: 'B', wallet_address: '0xb', percentage: 33.33 },
    { name: 'C', wallet_address: '0xc', percentage: 33.34 },
  ];

  await assert.doesNotReject(() => pocketService.setPocketRules('user-1', rules));
});

test('executeSplit throws when the user has no pocket rules configured', async () => {
  const { pocketService } = makeService();

  await assert.rejects(
    () => pocketService.executeSplit('user-no-rules', 'inv-1', 100, 'USDC', '0xpay'),
    /no pocket rules configured/,
  );
});

test('executeSplit logs a RECEIVE entry plus one SPLIT entry per pocket, and transfers the correct shares', async () => {
  const { pocketService, transactionLogRepository, web3Service } = makeService();

  await pocketService.setPocketRules('user-1', [
    { name: 'Operations', wallet_address: '0xop', percentage: 50 },
    { name: 'Personal', wallet_address: '0xpersonal', percentage: 30 },
    { name: 'Emergency Fund', wallet_address: '0xemergency', percentage: 20 },
  ]);

  const transfers = await pocketService.executeSplit('user-1', 'inv-1', 100, 'USDC', '0xpay');

  assert.equal(transfers.length, 3);
  assert.deepEqual(
    transfers.map((t) => t.amount),
    [50, 30, 20],
  );

  const receiveLogs = transactionLogRepository.logs.filter((l) => l.action === 'RECEIVE');
  const splitLogs = transactionLogRepository.logs.filter((l) => l.action === 'SPLIT');
  assert.equal(receiveLogs.length, 1);
  assert.equal(receiveLogs[0].amount, 100);
  assert.equal(splitLogs.length, 3);
  assert.equal(web3Service.transfers.length, 3);
});
