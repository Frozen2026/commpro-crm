import Link from "next/link";

import { getUserContext } from "@/lib/account-context";
import { clientMatchesQuery, loadClientsForContext } from "@/lib/clients-query";
import { loadPoliciesForClient, loadRecentCoiCertificates } from "@/lib/coi";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type ClientRow = {
  id: string;
  business_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone: string | null;
  email: string | null;
};

function clientLabel(client: ClientRow) {
  if (client.business_name?.trim()) return client.business_name;
  const person = [client.first_name, client.last_name].filter(Boolean).join(" ").trim();
  return person || client.id;
}

export default async function CoiRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    company_name?: string;
    phone?: string;
    email?: string;
    client_id?: string;
    holder_name?: string;
    holder_address?: string;
    policy_id?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const companyName = (params.company_name ?? "").trim();
  const phone = (params.phone ?? "").trim();
  const email = (params.email ?? "").trim();
  const selectedClientId = (params.client_id ?? "").trim();
  const holderName = (params.holder_name ?? "").trim();
  const holderAddress = (params.holder_address ?? "").trim();
  const preselectedPolicyIds = new Set(
    (Array.isArray(params.policy_id) ? params.policy_id : params.policy_id ? [params.policy_id] : [])
      .map((id) => id.trim())
      .filter(Boolean),
  );

  const context = await getUserContext();
  const admin = getSupabaseAdmin();

  let clients: ClientRow[] = [];

  if (selectedClientId) {
    const { data } = await admin
      .from("clients")
      .select("id, business_name, first_name, last_name, phone, email")
      .eq("id", selectedClientId)
      .maybeSingle();
    if (data) {
      clients = [data as ClientRow];
    } else {
      // Still show the full list so the user can pick another client
      const { data: all } = await loadClientsForContext(
        context,
        "id, business_name, first_name, last_name, phone, email",
      );
      clients = all as ClientRow[];
    }
  } else {
    const { data: all } = await loadClientsForContext(
      context,
      "id, business_name, first_name, last_name, phone, email",
    );
    let rows = all as ClientRow[];
    if (companyName || phone || email) {
      rows = rows.filter((client) =>
        clientMatchesQuery(client, companyName, phone, email),
      );
    }
    clients = rows.slice(0, 100);
  }

  const activeClientId = selectedClientId || (clients.length === 1 ? clients[0].id : "");
  const activeClient = clients.find((client) => client.id === activeClientId) ?? null;

  const policies = activeClientId
    ? await loadPoliciesForClient(context, activeClientId, { activeOnly: false })
    : [];

  const recentCertificates = activeClientId
    ? await loadRecentCoiCertificates(activeClientId)
    : [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">COI Request</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick a client and policies, then generate a COI PDF. Issued certificates are saved to the
          client record.
        </p>
      </div>

      <form className="grid gap-4 rounded-xl border border-[var(--border)] bg-white p-6 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Search clients</span>
          <input
            name="company_name"
            defaultValue={companyName}
            placeholder="Business or contact name"
            className="w-full rounded-md border border-[var(--border)] px-3 py-2"
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
        <button
          type="submit"
          className="w-fit rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Search
        </button>
      </form>

      {clients.length > 0 ? (
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6">
          <form className="space-y-2">
            <input type="hidden" name="company_name" value={companyName} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="email" value={email} />
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Client</span>
              <select
                name="client_id"
                defaultValue={activeClientId}
                className="w-full rounded-md border border-[var(--border)] px-3 py-2"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {clientLabel(client)}
                    {client.email ? ` · ${client.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Load policies for client
            </button>
          </form>

          {activeClient ? (
            <form action="/api/coi-pdf" method="get" className="space-y-4 border-t border-[var(--border)] pt-4">
              <input type="hidden" name="client_id" value={activeClient.id} />
              <input
                type="hidden"
                name="company_name"
                value={activeClient.business_name || clientLabel(activeClient)}
              />
              <input type="hidden" name="phone" value={activeClient.phone ?? phone} />
              <input type="hidden" name="email" value={activeClient.email ?? email} />

              <p className="text-sm text-slate-600">
                Issuing for{" "}
                <Link
                  href={`/clients/${activeClient.id}/edit`}
                  className="font-medium text-[var(--primary)]"
                >
                  {clientLabel(activeClient)}
                </Link>
              </p>

              <div>
                <p className="text-sm font-medium text-slate-700">Policies</p>
                <div className="mt-2 space-y-2 rounded-md border border-[var(--border)] p-3">
                  {policies.map((policy) => {
                    const checked =
                      preselectedPolicyIds.size === 0
                        ? policy.status === "active" || !policy.status
                        : preselectedPolicyIds.has(policy.id);
                    return (
                      <label
                        key={policy.id}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          name="policy_id"
                          value={policy.id}
                          defaultChecked={checked}
                        />
                        <span>
                          {policy.policy_number ?? "No Number"} ·{" "}
                          {policy.carrier_name ?? "Unknown Carrier"} ·{" "}
                          {policy.line_of_business ?? "-"}
                          {policy.status ? ` · ${policy.status}` : ""}
                        </span>
                      </label>
                    );
                  })}
                  {policies.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No policies for this client.{" "}
                      <Link
                        href={`/policies/new`}
                        className="font-medium text-[var(--primary)]"
                      >
                        Add a policy
                      </Link>{" "}
                      first.
                    </p>
                  ) : null}
                </div>
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Certificate Holder Name *</span>
                <input
                  name="certificate_holder_name"
                  required
                  defaultValue={holderName}
                  className="w-full rounded-md border border-[var(--border)] px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Certificate Holder Address</span>
                <textarea
                  name="certificate_holder_address"
                  rows={3}
                  defaultValue={holderAddress}
                  className="w-full rounded-md border border-[var(--border)] px-3 py-2"
                />
              </label>

              <button
                type="submit"
                disabled={policies.length === 0}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                Download COI PDF
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">Select a client and load policies to continue.</p>
          )}

          {recentCertificates.length > 0 ? (
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-medium text-slate-700">Recent COIs for this client</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {recentCertificates.map((cert) => (
                  <li key={cert.id}>
                    {cert.certificate_holder_name}
                    {cert.created_at
                      ? ` · ${new Date(cert.created_at).toLocaleDateString()}`
                      : ""}
                    {cert.policy_ids?.length
                      ? ` · ${cert.policy_ids.length} polic${cert.policy_ids.length === 1 ? "y" : "ies"}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-sm text-slate-500">
          {companyName || phone || email || selectedClientId
            ? "No matching clients found."
            : "No clients in the system yet."}{" "}
          <Link href="/clients/new" className="font-medium text-[var(--primary)]">
            Create a client
          </Link>
          , then return here or use <strong>Issue COI</strong> from the client page.
        </div>
      )}
    </section>
  );
}
