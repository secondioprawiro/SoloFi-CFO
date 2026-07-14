import type { PocketRepository } from '../repositories/PocketRepository.js';
import type { TransactionLogRepository } from '../repositories/TransactionLogRepository.js';
import type { Web3Service } from './Web3Service.js';
import type { PocketRuleInput } from '../types/pocket.types.js';

export class PocketService {
  constructor(
    private readonly pocketRepository: PocketRepository,
    private readonly transactionLogRepository: TransactionLogRepository,
    private readonly web3Service: Web3Service,
  ) {}

  async setPocketRules(userId: string, rules: PocketRuleInput[]) {
    const total = rules.reduce((sum, rule) => sum + rule.percentage, 0);
    if (Math.round(total * 100) / 100 !== 100) {
      throw new Error(`Pocket rule percentages must sum to 100 (got ${total}).`);
    }
    return this.pocketRepository.saveRules(userId, rules);
  }

  async getPocketRules(userId: string) {
    return this.pocketRepository.getRules(userId);
  }

  /** Called when an invoice is marked PAID — splits the received amount across pockets. */
  async executeSplit(userId: string, invoiceId: string, receivedAmount: number, currency: string, paymentTxHash: string) {
    const rules = await this.pocketRepository.getRules(userId);
    if (rules.length === 0) {
      throw new Error(`PocketService.executeSplit: user ${userId} has no pocket rules configured`);
    }

    const agentWallet = this.web3Service.getAgentAddress();
    await this.transactionLogRepository.log({
      userId,
      invoiceId,
      txHash: paymentTxHash,
      fromAddress: 'external',
      toAddress: agentWallet,
      amount: receivedAmount,
      currency,
      action: 'RECEIVE',
    });

    const transfers = await this.web3Service.splitPayment(receivedAmount, currency, rules);

    for (const transfer of transfers) {
      await this.transactionLogRepository.log({
        userId,
        invoiceId,
        txHash: transfer.txHash,
        fromAddress: agentWallet,
        toAddress: transfer.wallet_address,
        amount: transfer.amount,
        currency,
        action: 'SPLIT',
      });
    }

    return transfers;
  }
}
