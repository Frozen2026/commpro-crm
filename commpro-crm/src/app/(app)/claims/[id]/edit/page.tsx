import Link from "next/link";
import { notFound } from "next/navigation";

import { ClaimForm } from "@/app/(app)/claims/claim-form";
import { getUserContext } from "@/lib/account-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getUserContext();
  const supabase = await createServerSupabaseClient();

  const [{ data: claim }, { data: policiesData }] = await Promise.all([
    supabase
      .from("claims")
      .select("id, policy_id, claim_number, date_of_loss, description, adjuster_name, adjuster_phone, adjuster_email, status, reserve_amount, paid_amount")
      .eq("id", id)
      .eq("account_id", context.accountId)
      .maybeSingle(),
    supabase
      .from("policies")
      .select("id, policy_number, carrier_name")
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false }),
  ]);

  if (!claim) {
    notFound();
  }

  const policies = (policiesData ?? []).map((policy) => ({
    id: String(policy.id),
    label: `${policy.policy_number ?? "No Number"} - ${policy.carrier_name ?? "Unknown Carrier"}`,
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Claim</h2>
        <Link href="/claims" className="text-sm font-medium text-[#2563eb]">
          Back to Claims
        </Link>
      </div>
      <ClaimForm values={claim} policies={policies} />
    </section>
  );
}
