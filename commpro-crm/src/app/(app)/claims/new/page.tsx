import Link from "next/link";

import { ClaimForm } from "@/app/(app)/claims/claim-form";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

export default async function NewClaimPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("policies")
    .select("id, policy_number, carrier_name")
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false });

  const policies = (data ?? []).map((policy) => ({
    id: String(policy.id),
    label: `${policy.policy_number ?? "No Number"} - ${policy.carrier_name ?? "Unknown Carrier"}`,
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Claim</h2>
        <Link href="/claims" className="text-sm font-medium text-[#2563eb]">
          Back to Claims
        </Link>
      </div>
      <ClaimForm policies={policies} />
    </section>
  );
}
