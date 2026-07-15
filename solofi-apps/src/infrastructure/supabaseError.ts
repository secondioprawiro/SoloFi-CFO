// Supabase's client rejects with a plain PostgrestError object (not an Error
// instance) — `throw error` on that loses all detail once it crosses any layer
// that does `String(err)` or `err.message` on an assumed Error (e.g. the MCP
// SDK's tool-error formatting, which rendered these as the literal string
// "[object Object]"). Wrap at the repository boundary so callers always see a
// real Error with the underlying message intact.

import type { PostgrestError } from '@supabase/supabase-js';

export function assertNoSupabaseError(error: PostgrestError | null, context: string): void {
  if (!error) return;
  const detail = error.details ? ` (${error.details})` : '';
  throw new Error(`${context}: ${error.message}${detail}`);
}
