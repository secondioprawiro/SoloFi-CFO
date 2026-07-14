// PocketService — business logic for pocket rule management & auto-split execution
// TODO: inject TokenTransfer untuk eksekusi on-chain split

export class PocketService {
  constructor(pocketRepository, tokenTransfer) {
    this.pocketRepository = pocketRepository;
    this.tokenTransfer = tokenTransfer;
  }

  /**
   * @param {string} userId
   * @param {{name: string, wallet_address: string, percentage: number}[]} rules
   */
  async setPocketRules(userId, rules) {
    // TODO: validate percentages sum to 100
    // TODO: persist via pocketRepository.saveRules
    throw new Error('PocketService.setPocketRules: not implemented');
  }

  async getPocketRules(userId) {
    // TODO: delegate to pocketRepository.getRules
    throw new Error('PocketService.getPocketRules: not implemented');
  }

  /**
   * Called when an invoice is marked PAID — splits the received amount across pockets.
   * @param {string} userId
   * @param {number} receivedAmount
   * @param {string} currency
   */
  async executeSplit(userId, receivedAmount, currency) {
    // TODO: 1. load pocket rules for userId
    // TODO: 2. call tokenTransfer.splitPayment(receivedAmount, rules)
    // TODO: 3. log each resulting transfer to transaction_logs (action=SPLIT)
    throw new Error('PocketService.executeSplit: not implemented');
  }
}
