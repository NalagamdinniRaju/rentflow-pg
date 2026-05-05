import { supabase, supabaseUrl } from '~/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Shared error class for Supabase query failures.
 * Wraps PostgrestError for consistent error handling across all queries.
 */
export class SupabaseQueryError extends Error {
  code: string;
  details: string;
  hint: string;

  constructor(error: PostgrestError) {
    super(error.message);
    this.name = 'SupabaseQueryError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

/**
 * Helper to unwrap Supabase responses.
 * Throws SupabaseQueryError if the query returned an error.
 */
export function unwrapSupabaseResponse<T>(response: {
  data: T | null;
  error: PostgrestError | null;
}): T {
  if (response.error) {
    throw new SupabaseQueryError(response.error);
  }
  // Supabase returns null for data when using head: true (count-only queries)
  return response.data as T;
}

/**
 * Re-export supabase client for convenience within query files.
 */
export { supabase, supabaseUrl };
