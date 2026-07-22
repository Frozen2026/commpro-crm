import Link from "next/link";

import { PolicyForm } from "@/app/(app)/policies/policy-form";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

export default async function NewPolicyPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const [{ data }, { data: carriersData }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, business_name, first_name, last_name")
      .eq("account_id", context.accountId)
      .order("business_name", { ascending: true }),
    supabase
      .from("insurance_carriers")
      .select("name")
      .order("name", { ascending: true }),
  ]);

  const clients = (data ?? []).map((client) => {
    const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ");
    return {
      id: String(client.id),
      label: client.business_name || fullName || String(client.id),
    };
  });

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
