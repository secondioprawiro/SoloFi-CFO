import type { PocketRepository } from '../repositories/PocketRepository.js';
import type { TransactionLogRepository } from '../repositories/TransactionLogRepository.js';
import type { Web3Service } from './Web3Service.js';

const CURRENCY_FOR_BALANCE_QUERIES = 'USDC'; // MVP: pockets are queried in USDC only.

export class AdvisorService {
  constructor(
    private readonly pocketRepository: PocketRepository,
    private readonly transactionLogRepository: TransactionLogRepository,
    private readonly web3Service: Web3Service,
  ) {}

  async queryBalance(userId: string, pocketName?: string): Promise<string> {
    const pockets = await this.pocketRepository.getRules(userId);
    const filtered = pocketName ? pockets.filter((p) => p.name.toLowerCase() === pocketName.toLowerCase()) : pockets;

    if (filtered.length === 0) {
      return pocketName
        ? `I couldn't find a pocket named "${pocketName}". Set up pocket rules first.`
        : `You don't have any pockets set up yet.`;
    }

    const balances = await Promise.all(
      filtered.map(async (pocket) => ({
        name: pocket.name,
        balance: await this.web3Service.getBalance(pocket.wallet_address as `0x${string}`, CURRENCY_FOR_BALANCE_QUERIES),
      })),
    );

    return balances.map((b) => `${b.name}: ${b.balance.toFixed(2)} ${CURRENCY_FOR_BALANCE_QUERIES}`).join(', ');
  }

  async queryCashflow(userId: string, period: 'week' | 'month'): Promise<string> {
    const days = period === 'week' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const logs = await this.transactionLogRepository.findByUserSince(userId, since);
    const received = logs.filter((l) => l.action === 'RECEIVE');
    const split = logs.filter((l) => l.action === 'SPLIT');

    const totalReceived = received.reduce((sum, l) => sum + l.amount, 0);
    const totalSplit = split.reduce((sum, l) => sum + l.amount, 0);

    if (received.length === 0) {
      return `No income recorded in the last ${period}.`;
    }

    return (
      `In the last ${period}, you received ${totalReceived.toFixed(2)} across ${received.length} payment(s) ` +
      `and split ${totalSplit.toFixed(2)} into your pockets.`
    );
  }
}
