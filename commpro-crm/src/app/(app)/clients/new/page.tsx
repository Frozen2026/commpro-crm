import Link from "next/link";

import { ClientForm } from "@/app/(app)/clients/client-form";
import { ErrorConsoleLogger } from "@/app/(app)/clients/new/error-console-logger";

type NewClientPageProps = {
  searchParams?: Promise<{
    error?: string;
    supabase_error?: string;
  }>;
};

function getSupabaseError(supabaseError: string | undefined) {
  if (!supabaseError) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(supabaseError)) as {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
      status?: number;
    };
  } catch {
    return {
      message: supabaseError,
    };
  }
}

function getErrorMessage(error: string | undefined) {
  if (!error) {
    return null;
  }

  if (error === "first-name-required") {
    return "First name is required.";
  }

  if (error === "no-agency") {
    return "No agency record exists yet. Create an agency and try again.";
  }

  if (error === "agency-lookup-failed") {
    return "Unable to load agencies right now. Please try again.";
  }

  if (error === "auth-session-invalid") {
    return "Your login session is invalid or expired. Please sign in again.";
  }

  if (error === "supabase-env-missing") {
    return "Supabase environment variables are missing on the server.";
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
  const supabaseError = getSupabaseError(params?.supabase_error);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Client</h2>
        <Link href="/clients" className="text-sm font-medium text-[#2563eb]">
          Back to Clients
        </Link>
      </div>
      {errorMessage ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
      ) : null}
      <ErrorConsoleLogger error={errorMessage} supabaseError={supabaseError} />
      <ClientForm />
    </section>
  );
}
