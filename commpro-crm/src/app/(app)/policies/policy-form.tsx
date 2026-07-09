import { createPolicy, updatePolicy } from "@/app/(app)/policies/actions";

type ClientOption = {
  id: string;
  label: string;
};

type CarrierOption = {
  name: string;
};

type PolicyFormValues = {
  id?: string;
  client_id?: string | null;
  carrier_name?: string | null;
  policy_number?: string | null;
  line_of_business?: string | null;
  premium?: number | null;
  status?: string | null;
  effective_date?: string | null;
  expiration_date?: string | null;
};

const statusOptions = ["pending", "active", "cancelled", "expired", "non_renewed"];

export function PolicyForm({
  values,
  clients,
  carriers,
}: {
  values?: PolicyFormValues;
  clients: ClientOption[];
  carriers: CarrierOption[];
}) {
  const action = values?.id ? updatePolicy : createPolicy;

  return (
    <form action={action} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Client *</span>
          <select name="client_id" defaultValue={values?.client_id ?? ""} required className="w-full rounded-md border border-[var(--border)] px-3 py-2">
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Carrier Name *</span>
          <input
            name="carrier_name"
            required
            list="carrier-options"
            defaultValue={values?.carrier_name ?? ""}
            className="w-full rounded-md border border-[var(--border)] px-3 py-2"
          />
          <datalist id="carrier-options">
            {carriers.map((carrier) => (
              <option key={carrier.name} value={carrier.name} />
            ))}
          </datalist>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Policy Number</span>
          <input name="policy_number" defaultValue={values?.policy_number ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Line of Business *</span>
          <input name="line_of_business" required defaultValue={values?.line_of_business ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Premium *</span>
          <input name="premium" type="number" step="0.01" min="0" required defaultValue={values?.premium ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select name="status" defaultValue={values?.status ?? "pending"} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Effective Date</span>
          <input name="effective_date" type="date" defaultValue={values?.effective_date ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Expiration Date</span>
          <input name="expiration_date" type="date" defaultValue={values?.expiration_date ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
      </div>

      <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
        {values?.id ? "Update Policy" : "Create Policy"}
      </button>
    </form>
  );
}
