import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserContext = {
  userId: string;
  accountId: string;
  agencyId: string | null;
};

export async function getUserContext(): Promise<UserContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("accounts_memberships")
    .select("account_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.account_id) {
    throw new Error("Missing account membership");
  }

  const accountId = String(membership.account_id);

  const { data: agentProfile } = await supabase
    .from("agent_profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  let agencyId = agentProfile?.agency_id ? String(agentProfile.agency_id) : null;

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
