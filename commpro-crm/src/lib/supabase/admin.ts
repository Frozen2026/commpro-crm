import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/supabase/config";

let cached: SupabaseClient | null = null;

/** Service-role client — created lazily so builds don't crash when the key is Preview-only missing. */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }
  cached = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}

/** @deprecated Prefer getSupabaseAdmin() for lazy init. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
