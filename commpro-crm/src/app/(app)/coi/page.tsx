import Link from "next/link";

import { findClientsForCoi, loadActivePoliciesForClient } from "@/lib/coi/lookup-client";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

export default async function CoiRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ company_name?: string; phone?: string; email?: string; client_id?: string }>;
}) {
  const params = await searchParams;
  const companyName = (params.company_name ?? "").trim();
  const phone = (params.phone ?? "").trim();
  const email = (params.email ?? "").trim();
  const selectedClientId = (params.client_id ?? "").trim();

  const context = await getUserContext();
  const supabase = await createClient();

  let clients: Awaited<ReturnType<typeof findClientsForCoi>> = [];
  if (companyName || email || phone) {
    clients = await findClientsForCoi(supabase, context.accountId, {
      insuredName: companyName || email || phone,
      email,
      phone,
    });
  }

  const activeClientId = selectedClientId || (clients[0]?.id ?? "");
  const activeClient = clients.find((c) => c.id === activeClientId) ?? clients[0] ?? null;

  const policies = activeClientId
    ? await loadActivePoliciesForClient(supabase, context.accountId, activeClientId)
    : [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">COI Request</h2>
        <p className="mt-1 text-sm text-slate-600">
          Find a client by business name, email, or phone, select active policies, and download a COI PDF.
        </p>
      </div>

      <form className="grid gap-4 rounded-xl border border-[var(--border)] bg-white p-6 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Company Name</span>
          <input
            name="company_name"
            defaultValue={companyName}
            className="w-full rounded-md border border-[var(--border)] px-3 py-2"
            placeholder="Acme Construction LLC"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input name="phone" defaultValue={phone} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={email}
            className="w-full rounded-md border border-[var(--border)] px-3 py-2"
          />
        </label>
        <button type="submit" className="w-fit rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Search Client
        </button>
      </form>

      {clients.length > 0 ? (
        <form action="/api/coi-pdf" method="get" className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6">
          <input type="hidden" name="company_name" value={activeClient?.business_name || companyName} />
          <input type="hidden" name="phone" value={phone || activeClient?.phone || ""} />
          <input type="hidden" name="email" value={email || activeClient?.email || ""} />

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Matched Client</span>
            <select
              name="client_id"
              defaultValue={activeClientId}
              className="w-full rounded-md border border-[var(--border)] px-3 py-2"
              // Changing selection reloads policies via GET to this page.
              // Using formaction keeps PDF generation separate.
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.business_name ?? client.id}
                  {client.email ? ` · ${client.email}` : ""}
                </option>
              ))}
            </select>
          </label>

          <p className="text-xs text-slate-500">
            To switch clients and refresh policies,{" "}
            <Link
              href={`/coi?company_name=${encodeURIComponent(companyName)}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}&client_id=`}
              className="font-medium text-[var(--primary)]"
            >
              search again
            </Link>{" "}
            or open a client link below.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/coi?company_name=${encodeURIComponent(companyName || client.business_name || "")}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}&client_id=${client.id}`}
                className={`rounded-md border px-2 py-1 ${
                  client.id === activeClientId
                    ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)]"
                    : "border-[var(--border)] text-slate-600"
                }`}
              >
                {client.business_name ?? client.id}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Active Policies</p>
            <div className="mt-2 space-y-2 rounded-md border border-[var(--border)] p-3">
              {policies.map((policy) => (
                <label key={policy.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="policy_id" value={policy.id} defaultChecked />
                  <span>
                    {policy.policy_number ?? "No Number"} • {policy.carrier_name ?? "Unknown Carrier"} •{" "}
                    {policy.line_of_business ?? "-"}
                  </span>
                </label>
              ))}
              {policies.length === 0 ? <p className="text-sm text-slate-500">No active policies found for this client.</p> : null}
            </div>
          </div>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Certificate Holder Name</span>
            <input name="certificate_holder_name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Certificate Holder Address</span>
            <textarea name="certificate_holder_address" rows={3} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
          </label>

          <button
            type="submit"
            disabled={policies.length === 0}
            className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            Download PDF
          </button>
        </form>
      ) : companyName || email || phone ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-sm text-slate-500">
          No matching clients found.
        </div>
      ) : null}
    </section>
  );
}
