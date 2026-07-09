import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserContext = {
  userId: string;
  accountId: string;
  agencyId: string | null;
};

export async function getUserContext(): Promise<UserContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("accounts_memberships")
    .select("account_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const { data: agentProfile } = await supabase
    .from("agent_profiles")
    .select("account_id, agency_id")
    .eq("id", user.id)
    .maybeSingle();

  // Prefer membership account, then profile account, then any known agency account,
  // and finally fall back to user id so pages can render instead of crashing.
  let accountId = membership?.account_id
    ? String(membership.account_id)
    : agentProfile?.account_id
      ? String(agentProfile.account_id)
      : null;

  let agencyId = agentProfile?.agency_id ? String(agentProfile.agency_id) : null;

  if (!accountId) {
    const { data: anyAgency } = await supabase
      .from("agencies")
      .select("id, account_id")
      .limit(1)
      .maybeSingle();

    if (anyAgency?.account_id) {
      accountId = String(anyAgency.account_id);
    }

    if (!agencyId && anyAgency?.id) {
      agencyId = String(anyAgency.id);
    }
  }

  if (!accountId) {
    accountId = user.id;
  }

  if (!agencyId) {
    const { data: firstAgency } = await supabase
      .from("agencies")
      .select("id")
      .eq("account_id", accountId)
      .limit(1)
      .maybeSingle();

    if (firstAgency?.id) {
      agencyId = String(firstAgency.id);
    }
  }

  return {
    userId: user.id,
    accountId,
    agencyId,
  };
}
