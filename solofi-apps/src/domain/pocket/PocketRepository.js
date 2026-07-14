// PocketRepository — data access layer for the pockets / pocket_rules tables
// TODO: implement using supabase.client.js

export class PocketRepository {
  async saveRules(userId, rules) {
    // TODO: replace existing pockets for userId with new rules (transaction)
    throw new Error('PocketRepository.saveRules: not implemented');
  }

  async getRules(userId) {
    // TODO: select from pockets where user_id = userId
    throw new Error('PocketRepository.getRules: not implemented');
  }
}
