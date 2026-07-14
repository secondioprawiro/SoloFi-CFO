export interface Pocket {
  id: string;
  user_id: string;
  name: string;
  wallet_address: string;
  percentage: number;
  created_at: string;
}

export interface PocketRuleInput {
  name: string;
  wallet_address: string;
  percentage: number;
}

export interface TransactionLog {
  id: string;
  user_id: string;
  invoice_id: string | null;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  currency: string;
  action: 'RECEIVE' | 'SPLIT';
  created_at: string;
}
