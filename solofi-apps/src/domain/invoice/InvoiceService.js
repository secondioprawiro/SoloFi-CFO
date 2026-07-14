// InvoiceService — business logic for invoice lifecycle
// TODO: inject XLayerMonitor untuk mulai watch pembayaran setelah invoice dibuat

export class InvoiceService {
  constructor(invoiceRepository, xLayerMonitor) {
    this.invoiceRepository = invoiceRepository;
    this.xLayerMonitor = xLayerMonitor;
  }

  /**
   * @param {string} userId
   * @param {string} clientName
   * @param {number} amount
   * @param {string} currency
   */
  async createInvoice(userId, clientName, amount, currency) {
    // TODO: 1. create invoice via repository (status PENDING)
    // TODO: 2. start XLayerMonitor.watchForPayment for the receiving wallet
    // TODO: 3. return invoice + receiving wallet address
    throw new Error('InvoiceService.createInvoice: not implemented');
  }

  /**
   * @param {string} invoiceId
   * @param {string} txHash
   */
  async markAsPaid(invoiceId, txHash) {
    // TODO: update invoice status to PAID, then trigger PocketService.executeSplit
    throw new Error('InvoiceService.markAsPaid: not implemented');
  }

  async getInvoicesByUser(userId) {
    // TODO: delegate to invoiceRepository.findByUser
    throw new Error('InvoiceService.getInvoicesByUser: not implemented');
  }

  async getPendingInvoices(userId) {
    // TODO: delegate to invoiceRepository.findPendingByUser
    throw new Error('InvoiceService.getPendingInvoices: not implemented');
  }
}
