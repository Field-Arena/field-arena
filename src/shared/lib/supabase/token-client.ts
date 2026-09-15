import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.types';
import { env } from '@/shared/lib/env';

/**
 * Bundles a Supabase client with the access token it was scoped to, when it
 * has one — a handful of query/mutation helpers (getStaffProfile, getMySeat,
 * the scoring write actions) accept this optionally so the relay route can
 * run them as the *token's* owner instead of the request's own cookies.
 * `auth.getUser()` needs the raw token explicitly when there's no cookie
 * session backing the client (see createTokenClient below), so it travels
 * alongside the client rather than being re-derivable from it.
 */
export interface ScopedAuth {
  client: SupabaseClient<Database>;
  accessToken?: string;
}

/**
 * A Supabase client authenticated with a caller-supplied access token instead
 * of the request's own cookies — used only by the scoring relay route
 * (see src/app/api/scoring/relay/route.ts): a device that has internet
 * forwards a write on behalf of a paired peer device that doesn't, and the
 * write must still run as the *peer's* identity (their own JWT), not the
 * relaying device's session, so RLS and the seat-ownership trigger see the
 * real actor. Never persists or refreshes — this client lives for exactly
 * one request.
 */
export function createTokenClient(accessToken: string) {
  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
