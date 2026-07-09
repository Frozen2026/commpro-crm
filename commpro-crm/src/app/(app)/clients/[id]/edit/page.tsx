import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientForm } from "@/app/(app)/clients/client-form";
import { getUserContext } from "@/lib/account-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getUserContext();
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("clients")
    .select("id, first_name, last_name, business_name, email, phone, address, city, state, zip")
    .eq("id", id);

  query = context.agencyId ? query.eq("agency_id", context.agencyId) : query.eq("owner_id", context.userId);

  const { data: client } = await query.maybeSingle();

  if (!client) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Client</h2>
        <Link href="/clients" className="text-sm font-medium text-[#2563eb]">
          Back to Clients
        </Link>
      </div>
      <ClientForm values={client} />
    </section>
  );
}
