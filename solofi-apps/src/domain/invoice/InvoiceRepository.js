// InvoiceRepository — data access layer for the invoices table
// TODO: implement using supabase.client.js

export class InvoiceRepository {
  async create({ userId, clientName, amount, currency }) {
    // TODO: insert into invoices (status=PENDING), return created row
    throw new Error('InvoiceRepository.create: not implemented');
  }

  async findById(invoiceId) {
    // TODO: select from invoices where id = invoiceId
    throw new Error('InvoiceRepository.findById: not implemented');
  }

  async findByUser(userId) {
    // TODO: select from invoices where user_id = userId
    throw new Error('InvoiceRepository.findByUser: not implemented');
  }

  async findPendingByUser(userId) {
    // TODO: select from invoices where user_id = userId and status = 'PENDING'
    throw new Error('InvoiceRepository.findPendingByUser: not implemented');
  }

  async markAsPaid(invoiceId, txHash) {
    // TODO: update invoices set status='PAID', payment_tx_hash=txHash, paid_at=now()
    throw new Error('InvoiceRepository.markAsPaid: not implemented');
  }
}
