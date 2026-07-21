import Link from "next/link";

import { createClient } from "@/app/(app)/clients/actions";
import { ClientForm } from "@/app/(app)/clients/client-form";

type NewClientPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error: string | undefined) {
  if (!error) {
    return null;
  }

  if (error === "agency-not-found" || error === "no-agency" || error === "agency-lookup-failed") {
    return "No agency record could be found or created. Please try again or contact support.";
  }

  if (error === "insert-failed") {
    return "Client insert failed. Please verify the fields and try again.";
  }

  if (error === "first-name-required") {
    return "First name is required.";
  }

  if (error === "supabase-env-missing") {
    return "Server configuration is missing Supabase environment variables.";
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

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Client</h2>
          <p className="mt-1 text-sm text-slate-600">Create a client record for your agency book of business.</p>
        </div>
        <Link href="/clients" className="text-sm font-medium text-[#2563eb]">
          Back to Clients
        </Link>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
      ) : null}

      <ClientForm createAction={createClient} />
    </section>
  );
}
