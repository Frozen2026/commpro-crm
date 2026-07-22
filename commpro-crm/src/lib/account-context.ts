import { redirect } from "next/navigation";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserContext = {
  userId: string;
  accountId: string;
  agencyId: string | null;
};

function isMissingColumnError(message?: string | null) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the");
}

/**
 * Resolve the signed-in user's tenant context.
 * Tolerates production schemas missing accounts / agencies.account_id.
 */
export async function getUserContext(): Promise<UserContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    admin = null;
  }
  const db = admin ?? supabase;

  let accountId: string | null = null;
  let agencyId: string | null = null;

  {
    const { data: membership, error } = await db
      .from("accounts_memberships")
      .select("account_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!error && membership?.account_id) {
      accountId = String(membership.account_id);
    }
  }

  {
    const { data: agentProfile, error } = await db
      .from("agent_profiles")
      .select("account_id, agency_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && agentProfile) {
      if (!accountId && agentProfile.account_id) {
        accountId = String(agentProfile.account_id);
      }
      if (agentProfile.agency_id) {
        agencyId = String(agentProfile.agency_id);
      }
    }
  }

  if (!agencyId) {
    const { data: anyAgency, error } = await db
      .from("agencies")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (!error && anyAgency?.id) {
      agencyId = String(anyAgency.id);
    }
  }

  if (!accountId && agencyId) {
    const { data: agencyWithAccount, error } = await db
      .from("agencies")
      .select("id, account_id")
      .eq("id", agencyId)
      .maybeSingle();
    if (!error && agencyWithAccount?.account_id) {
      accountId = String(agencyWithAccount.account_id);
    } else if (error && !isMissingColumnError(error.message)) {
      console.warn("[getUserContext] agency account lookup", error.message);
    }
  }

  if (!accountId) {
    accountId = user.id;
  }

  return {
    userId: user.id,
    accountId,
    agencyId,
  };
}
