// Supabase client — shared connection used by every repository.
// Uses the service-role key because the agent backend performs writes on behalf of
// users after verifying intent server-side (no end-user session/JWT in this flow);
// table-level RLS policies (see migrations/001_initial_schema.sql) still apply to
// any client built with the anon key elsewhere in the stack.

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { persistSession: false },
});
