import Link from "next/link";
import { notFound } from "next/navigation";

import { PolicyForm } from "@/app/(app)/policies/policy-form";
import { getUserContext } from "@/lib/account-context";
import { isMissingColumnError, loadClientsForContext, toClientPickerOptions } from "@/lib/clients-query";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function EditPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getUserContext();
  const admin = getSupabaseAdmin();

  const policySelect =
    "id, client_id, carrier_name, policy_number, line_of_business, premium, status, effective_date, expiration_date";

  let policy = null;

  {
    const { data, error } = await admin
      .from("policies")
      .select(policySelect)
      .eq("id", id)
      .eq("account_id", context.accountId)
      .maybeSingle();

    if (!error) {
      policy = data;
    } else if (!isMissingColumnError(error.message)) {
      console.error("[policies.edit] account-scoped load failed", error.message);
    }
  }

  if (!policy && context.agencyId) {
    const { data } = await admin
      .from("policies")
      .select(policySelect)
      .eq("id", id)
      .eq("agency_id", context.agencyId)
      .maybeSingle();
    policy = data;
  }

  if (!policy) {
    const { data } = await admin.from("policies").select(policySelect).eq("id", id).maybeSingle();
    policy = data;
  }

  if (!policy) {
    notFound();
  }

  const [{ data: clientRows }, { data: carriersData }] = await Promise.all([
    loadClientsForContext(context, "id, business_name, first_name, last_name"),
    admin.from("insurance_carriers").select("name").order("name", { ascending: true }),
  ]);

  const clients = toClientPickerOptions(clientRows);
  const carriers = (carriersData ?? []).map((carrier) => ({
    name: String((carrier as { name: string }).name),
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Policy</h2>
        <Link href="/policies" className="text-sm font-medium text-[var(--primary)]">
          Back to Policies
        </Link>
      </div>
      <PolicyForm values={policy} clients={clients} carriers={carriers} />
    </section>
  );
}
