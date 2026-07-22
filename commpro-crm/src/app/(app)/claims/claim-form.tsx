import { createClaim, updateClaim } from "@/app/(app)/claims/actions";

type PolicyOption = {
  id: string;
  label: string;
};

type ClaimFormValues = {
  id?: string;
  policy_id?: string | null;
  claim_number?: string | null;
  date_of_loss?: string | null;
  description?: string | null;
  adjuster_name?: string | null;
  adjuster_phone?: string | null;
  adjuster_email?: string | null;
  status?: string | null;
  reserve_amount?: number | null;
  paid_amount?: number | null;
};

const statusOptions = ["reported", "open", "in_review", "negotiating", "closed", "denied"];

export function ClaimForm({ values, policies }: { values?: ClaimFormValues; policies: PolicyOption[] }) {
  const action = values?.id ? updateClaim : createClaim;

  return (
    <form action={action} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Policy *</span>
          <select name="policy_id" defaultValue={values?.policy_id ?? ""} required className="w-full rounded-md border border-[var(--border)] px-3 py-2">
            <option value="" disabled>
              Select policy
            </option>
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Claim Number</span>
          <input name="claim_number" defaultValue={values?.claim_number ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Date of Loss *</span>
          <input name="date_of_loss" type="date" required defaultValue={values?.date_of_loss ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Description</span>
          <textarea name="description" rows={3} defaultValue={values?.description ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Adjuster Name</span>
          <input name="adjuster_name" defaultValue={values?.adjuster_name ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Adjuster Phone</span>
          <input name="adjuster_phone" defaultValue={values?.adjuster_phone ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Adjuster Email</span>
          <input name="adjuster_email" type="email" defaultValue={values?.adjuster_email ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select name="status" defaultValue={values?.status ?? "reported"} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Reserve Amount</span>
          <input name="reserve_amount" type="number" min="0" step="0.01" defaultValue={values?.reserve_amount ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Paid Amount</span>
          <input name="paid_amount" type="number" min="0" step="0.01" defaultValue={values?.paid_amount ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
      </div>

      <button type="submit" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
        {values?.id ? "Update Claim" : "Create Claim"}
      </button>
    </form>
  );
}
