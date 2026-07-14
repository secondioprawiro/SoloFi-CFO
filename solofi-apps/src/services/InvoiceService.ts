import type { InvoiceRepository } from '../repositories/InvoiceRepository.js';
import type { Web3Service } from './Web3Service.js';
import type { Invoice } from '../types/invoice.types.js';

type PaymentDetectedHandler = (invoice: Invoice, txHash: string) => void | Promise<void>;

export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly web3Service: Web3Service,
    /** Called once payment lands on-chain — index.ts wires this to PocketService.executeSplit + proactive notification. */
    private readonly onPaymentDetected: PaymentDetectedHandler,
  ) {}

  async createInvoice(userId: string, clientName: string, amount: number, currency: string) {
    const invoice = await this.invoiceRepository.create({ userId, clientName, amount, currency });
    const receivingWallet = this.web3Service.getAgentAddress();

    this.web3Service.watchForPayment(receivingWallet, amount, currency, async (txHash) => {
      const updated = await this.invoiceRepository.markAsPaid(invoice.id, txHash);
      await this.onPaymentDetected(updated, txHash);
    });

    return { invoice, receivingWallet };
  }

  async markAsPaid(invoiceId: string, txHash: string): Promise<Invoice> {
    return this.invoiceRepository.markAsPaid(invoiceId, txHash);
  }

  async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findByUser(userId);
  }

  async getPendingInvoices(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findPendingByUser(userId);
  }
}
