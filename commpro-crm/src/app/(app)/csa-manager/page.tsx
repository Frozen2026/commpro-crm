import { CsaManagerClient } from "@/app/(app)/csa-manager/csa-manager-client";
import { getUserContext } from "@/lib/account-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CsaManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ dot?: string }>;
}) {
  const params = await searchParams;
  const dotNumber = (params.dot ?? "").trim();
  const context = await getUserContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: alertsData }, { data: scoreData }] = await Promise.all([
    supabase
      .from("csa_alerts")
      .select("id, dot_number, severity, reason, status, created_at")
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false }),
    dotNumber
      ? supabase
          .from("leads")
          .select("id, business_name, source, ai_score, external_id")
          .eq("account_id", context.accountId)
          .eq("external_id", dotNumber)
      : supabase
          .from("leads")
          .select("id, business_name, source, ai_score, external_id")
          .eq("account_id", context.accountId)
          .order("created_at", { ascending: false })
          .limit(10),
  ]);

  return (
    <CsaManagerClient
      dotNumber={dotNumber}
      alerts={(alertsData ?? []) as Array<{
        id: string;
        dot_number: string;
        severity: string;
        reason: string;
        status: string;
        created_at: string;
      }>}
      scoreRows={(scoreData ?? []) as Array<{
        id: string;
        business_name: string | null;
        source: string | null;
        ai_score: number | null;
        external_id: string | null;
      }>}
    />
  );
}
