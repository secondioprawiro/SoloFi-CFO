import { supabase } from '../infrastructure/supabase.client.js';
import type { Invoice } from '../types/invoice.types.js';

export class InvoiceRepository {
  async create(params: {
    userId: string;
    clientName: string;
    amount: number;
    currency: string;
  }): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: params.userId,
        client_name: params.clientName,
        amount: params.amount,
        currency: params.currency,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Invoice;
  }

  async findById(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle();
    if (error) throw error;
    return (data as Invoice) ?? null;
  }

  async findByUser(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Invoice[]) ?? [];
  }

  async findPendingByUser(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Invoice[]) ?? [];
  }

  /**
   * MVP payment matching: all invoices settle to a single shared agent wallet
   * (no per-invoice deposit address / HD derivation yet), so an incoming
   * transfer is reconciled to the oldest PENDING invoice with a matching
   * amount + currency. Two simultaneously pending invoices for the exact same
   * amount/currency will race — acceptable for the hackathon demo, called out
   * as a follow-up in PRD.md.
   */
  async findOldestPendingMatch(amount: number, currency: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'PENDING')
      .eq('currency', currency)
      .eq('amount', amount)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data as Invoice) ?? null;
  }

  async markAsPaid(invoiceId: string, txHash: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'PAID', payment_tx_hash: txHash, paid_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select('*')
      .single();

    if (error) throw error;
    return data as Invoice;
  }
}
