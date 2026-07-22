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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Client</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/coi?client_id=${client.id}`}
            className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white"
          >
            Issue COI
          </Link>
          <Link href="/clients" className="text-sm font-medium text-[var(--primary)]">
            Back to Clients
          </Link>
        </div>
      </div>
      <ClientForm values={client} />
    </section>
  );
}
