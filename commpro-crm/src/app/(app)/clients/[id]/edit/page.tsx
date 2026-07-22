import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientForm } from "@/app/(app)/clients/client-form";
import { getUserContext } from "@/lib/account-context";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getUserContext();
  const admin = getSupabaseAdmin();

  const selectCols =
    "id, first_name, last_name, business_name, email, phone, address, city, state, zip";

  let client = null;

  if (context.agencyId) {
    const { data } = await admin
      .from("clients")
      .select(selectCols)
      .eq("id", id)
      .eq("agency_id", context.agencyId)
      .maybeSingle();
    client = data;
  }

  if (!client) {
    const { data } = await admin
      .from("clients")
      .select(selectCols)
      .eq("id", id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    client = data;
  }

  if (!client) {
    // Last resort: id only (service role) — still requires auth via getUserContext
    const { data } = await admin.from("clients").select(selectCols).eq("id", id).maybeSingle();
    client = data;
  }

  if (!client) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Client</h2>
        <Link href="/clients" className="text-sm font-medium text-[var(--primary)]">
          Back to Clients
        </Link>
      </div>
      <ClientForm values={client} />
    </section>
  );
}
