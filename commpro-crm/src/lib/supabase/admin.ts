import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/supabase/config";

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
