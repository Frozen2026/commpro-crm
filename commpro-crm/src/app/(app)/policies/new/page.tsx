import Link from "next/link";

import { PolicyForm } from "@/app/(app)/policies/policy-form";
import { getUserContext } from "@/lib/account-context";
import { loadClientsForContext, toClientPickerOptions } from "@/lib/clients-query";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function NewPolicyPage() {
  const context = await getUserContext();
  const admin = getSupabaseAdmin();

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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Policy</h2>
        <Link href="/policies" className="text-sm font-medium text-[var(--primary)]">
          Back to Policies
        </Link>
      </div>
      <PolicyForm clients={clients} carriers={carriers} />
    </section>
  );
}
