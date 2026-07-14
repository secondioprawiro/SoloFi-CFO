export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  payment_tx_hash: string | null;
  created_at: string;
  paid_at: string | null;
}
