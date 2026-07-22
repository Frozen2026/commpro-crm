import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

type NewClientPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error: string | undefined) {
  if (!error) {
    return null;
  }

  if (error === "agency-not-found") {
    return "No agency record exists yet. Create an agency first and try again.";
  }

  if (error === "insert-failed") {
    return "Client insert failed. Please verify the fields and try again.";
  }

  try {
    return decodeURIComponent(error);
  } catch {
    return error;
  }
}

export default async function NewClientPage({ searchParams }: NewClientPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = getErrorMessage(params?.error);

  async function createClient(formData: FormData) {
    "use server";

    const supabase = await createSupabaseServerClient();

    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (agencyError || !agency?.id) {
      redirect("/clients/new?error=agency-not-found");
    }

    const { error: insertError } = await supabase.from("clients").insert({
      agency_id: agency.id,
      first_name: String(formData.get("first_name") ?? ""),
      last_name: String(formData.get("last_name") ?? ""),
      business_name: String(formData.get("business_name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      zip: String(formData.get("zip") ?? ""),
    });

    if (insertError) {
      redirect(`/clients/new?error=${encodeURIComponent(insertError.message || "insert-failed")}`);
    }

    redirect("/clients");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Client</h2>
          <p className="mt-1 text-sm text-slate-600">Create a client record with a simple server action form.</p>
        </div>
        <Link href="/clients" className="text-sm font-medium text-[var(--primary)]">
          Back to Clients
        </Link>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
      ) : null}

      <form action={createClient} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input id="first_name" name="first_name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
          </div>
          <div>
            <label htmlFor="last_name" className="mb-1 block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input id="last_name" name="last_name" required className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
          </div>
        </div>

        <div>
          <label htmlFor="business_name" className="mb-1 block text-sm font-medium text-slate-700">
            Business name
          </label>
          <input id="business_name" name="business_name" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input id="email" name="email" type="email" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input id="phone" name="phone" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
            Address
          </label>
          <input id="address" name="address" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium text-slate-700">
              City
            </label>
            <input id="city" name="city" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
          </div>
          <div>
            <label htmlFor="state" className="mb-1 block text-sm font-medium text-slate-700">
              State
            </label>
            <input id="state" name="state" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
          </div>
          <div>
            <label htmlFor="zip" className="mb-1 block text-sm font-medium text-slate-700">
              ZIP
            </label>
            <input id="zip" name="zip" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" />
          </div>
        </div>

        <button type="submit" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-95">
          Create Client
        </button>
      </form>
    </section>
  );
}
