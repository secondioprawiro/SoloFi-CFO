import { supabase } from '../infrastructure/supabase.client.js';
import type { TransactionLog } from '../types/pocket.types.js';

export class TransactionLogRepository {
  async log(entry: {
    userId: string;
    invoiceId?: string | null;
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    currency: string;
    action: 'RECEIVE' | 'SPLIT';
  }): Promise<TransactionLog> {
    const { data, error } = await supabase
      .from('transaction_logs')
      .insert({
        user_id: entry.userId,
        invoice_id: entry.invoiceId ?? null,
        tx_hash: entry.txHash,
        from_address: entry.fromAddress,
        to_address: entry.toAddress,
        amount: entry.amount,
        currency: entry.currency,
        action: entry.action,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as TransactionLog;
  }

  async findByUserSince(userId: string, sinceIso: string): Promise<TransactionLog[]> {
    const { data, error } = await supabase
      .from('transaction_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as TransactionLog[]) ?? [];
  }
}
