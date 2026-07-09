import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

type ClientRow = {
  id: string;
  business_name: string | null;
  phone: string | null;
  email: string | null;
};

type PolicyRow = {
  id: string;
  policy_number: string | null;
  line_of_business: string | null;
  carrier_name: string | null;
};

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

  let clients: ClientRow[] = [];
  if (companyName) {
    const { data } = await supabase
      .from("clients")
      .select("id, business_name, phone, email")
      .eq("account_id", context.accountId)
      .ilike("business_name", `%${companyName}%`)
      .order("business_name", { ascending: true })
      .limit(10);
    clients = (data ?? []) as ClientRow[];
  }

  const activeClientId = selectedClientId || (clients[0]?.id ?? "");

  let policies: PolicyRow[] = [];
  if (activeClientId) {
    const { data } = await supabase
      .from("policies")
      .select("id, policy_number, line_of_business, carrier_name")
      .eq("account_id", context.accountId)
      .eq("client_id", activeClientId)
      .eq("status", "active")
      .order("expiration_date", { ascending: true });

    policies = (data ?? []) as PolicyRow[];
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">COI Request</h2>
        <p className="mt-1 text-sm text-slate-600">Find a client, select active policies, and generate a downloadable COI PDF.</p>
      </div>

      <form className="grid gap-4 rounded-xl border border-[var(--border)] bg-white p-6 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Company Name</span>
          <input name="company_name" required defaultValue={companyName} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input name="phone" defaultValue={phone} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input name="email" type="email" defaultValue={email} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <button type="submit" className="w-fit rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Search Client
        </button>
      </form>

      {clients.length > 0 ? (
        <form action="/api/coi-pdf" method="get" className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6">
          <input type="hidden" name="company_name" value={companyName} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="email" value={email} />

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Matched Client</span>
            <select name="client_id" defaultValue={activeClientId} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.business_name ?? client.id}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-medium text-slate-700">Active Policies</p>
            <div className="mt-2 space-y-2 rounded-md border border-[var(--border)] p-3">
              {policies.map((policy) => (
                <label key={policy.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="policy_id" value={policy.id} defaultChecked />
                  <span>
                    {policy.policy_number ?? "No Number"} • {policy.carrier_name ?? "Unknown Carrier"} • {policy.line_of_business ?? "-"}
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

          <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
            Download PDF
          </button>
        </form>
      ) : companyName ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-sm text-slate-500">
          No matching clients found.
        </div>
      ) : null}
    </section>
  );
}
