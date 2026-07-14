// AdvisorService — natural-language financial queries (balance, cashflow)
// TODO: inject XLayerMonitor (on-chain balance) + repositories (transaction_logs, invoices)

export class AdvisorService {
  constructor(xLayerMonitor, pocketRepository, invoiceRepository) {
    this.xLayerMonitor = xLayerMonitor;
    this.pocketRepository = pocketRepository;
    this.invoiceRepository = invoiceRepository;
  }

  /**
   * @param {string} userId
   * @param {string} [pocketName]
   */
  async queryBalance(userId, pocketName) {
    // TODO: 1. load pocket(s) for userId (all or filtered by pocketName)
    // TODO: 2. call xLayerMonitor.getBalance for each pocket wallet
    // TODO: 3. format natural-language response
    throw new Error('AdvisorService.queryBalance: not implemented');
  }

  /**
   * @param {string} userId
   * @param {'week' | 'month'} period
   */
  async queryCashflow(userId, period) {
    // TODO: 1. read transaction_logs + invoices for the given period
    // TODO: 2. aggregate income vs. pocket splits
    // TODO: 3. format natural-language cashflow summary
    throw new Error('AdvisorService.queryCashflow: not implemented');
  }
}
