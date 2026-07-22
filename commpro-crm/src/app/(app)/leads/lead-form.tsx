import { createLead, updateLead } from "@/app/(app)/leads/actions";

type LeadFormValues = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  stage?: string | null;
  line_of_business?: string | null;
  estimated_premium?: number | null;
};

const stageOptions = ["new", "contacted", "quoted", "application", "bound", "lost"];

export function LeadForm({ values }: { values?: LeadFormValues }) {
  const action = values?.id ? updateLead : createLead;

  return (
    <form action={action} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">First Name *</span>
          <input name="first_name" required defaultValue={values?.first_name ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Last Name</span>
          <input name="last_name" defaultValue={values?.last_name ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Business Name</span>
          <input name="business_name" defaultValue={values?.business_name ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input name="email" type="email" defaultValue={values?.email ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input name="phone" defaultValue={values?.phone ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Source</span>
          <input name="source" defaultValue={values?.source ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Stage</span>
          <select name="stage" defaultValue={values?.stage ?? "new"} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
            {stageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Line of Business</span>
          <input name="line_of_business" defaultValue={values?.line_of_business ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Estimated Premium</span>
          <input name="estimated_premium" type="number" step="0.01" min="0" defaultValue={values?.estimated_premium ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
      </div>

      <button type="submit" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
        {values?.id ? "Update Lead" : "Create Lead"}
      </button>
    </form>
  );
}
