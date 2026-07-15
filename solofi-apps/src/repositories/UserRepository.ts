import { supabase } from '../infrastructure/supabase.client.js';
import { assertNoSupabaseError } from '../infrastructure/supabaseError.js';

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

    assertNoSupabaseError(findError, 'UserRepository.findOrCreateByWallet (find)');
    if (existing) return existing as User;

    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert({ wallet_address: walletAddress })
      .select('*')
      .single();

    assertNoSupabaseError(insertError, 'UserRepository.findOrCreateByWallet (create)');
    return created as User;
  }

  async findById(userId: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    assertNoSupabaseError(error, 'UserRepository.findById');
    return (data as User) ?? null;
  }
}
