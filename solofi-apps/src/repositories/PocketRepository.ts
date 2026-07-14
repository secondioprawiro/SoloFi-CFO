import { supabase } from '../infrastructure/supabase.client.js';
import type { Pocket, PocketRuleInput } from '../types/pocket.types.js';

export class PocketRepository {
  /** Replaces all pocket rules for a user in one transaction-like delete+insert. */
  async saveRules(userId: string, rules: PocketRuleInput[]): Promise<Pocket[]> {
    const { error: deleteError } = await supabase.from('pockets').delete().eq('user_id', userId);
    if (deleteError) throw deleteError;

    const { data, error: insertError } = await supabase
      .from('pockets')
      .insert(rules.map((rule) => ({ user_id: userId, ...rule })))
      .select('*');

    if (insertError) throw insertError;
    return (data as Pocket[]) ?? [];
  }

  async getRules(userId: string): Promise<Pocket[]> {
    const { data, error } = await supabase
      .from('pockets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as Pocket[]) ?? [];
  }
}
