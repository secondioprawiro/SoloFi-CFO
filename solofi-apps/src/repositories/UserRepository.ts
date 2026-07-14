import { supabase } from '../infrastructure/supabase.client.js';

export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
}

export class UserRepository {
  async findOrCreateByWallet(walletAddress: string): Promise<User> {
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (findError) throw findError;
    if (existing) return existing as User;

    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert({ wallet_address: walletAddress })
      .select('*')
      .single();

    if (insertError) throw insertError;
    return created as User;
  }

  async findById(userId: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return (data as User) ?? null;
  }
}
