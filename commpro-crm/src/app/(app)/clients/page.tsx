import Link from "next/link";

import { deleteClient } from "@/app/(app)/clients/actions";
import { getUserContext } from "@/lib/account-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ClientRow = {
  id: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string | null;
};

export default async function ClientsPage() {
  const context = await getUserContext();
  const supabase = await createServerSupabaseClient();

  if (!context.agencyId) {
    throw new Error("No agency is configured for this account.");
  }

  const { data } = await supabase
    .from("clients")
    .select("id, business_name, email, phone, city, state, created_at")
    .eq("agency_id", context.agencyId)
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as ClientRow[];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Clients</h2>
          <p className="mt-1 text-sm text-slate-600">Maintain insured accounts and contact information.</p>
        </div>
        <Link href="/clients/new" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Add Client
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Business Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-slate-900">{client.business_name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{client.email ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{client.phone ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{client.city ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{client.state ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {client.created_at ? new Date(client.created_at).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/clients/${client.id}/edit`} className="font-medium text-[#2563eb]">
                      Edit
                    </Link>
                    <form action={deleteClient}>
                      <input type="hidden" name="id" value={client.id} />
                      <button type="submit" className="text-sm font-medium text-rose-600">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No clients found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
