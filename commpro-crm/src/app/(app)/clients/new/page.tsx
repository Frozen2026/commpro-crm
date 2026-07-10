import Link from "next/link";
import { redirect } from "next/navigation";

import { ClientForm } from "@/app/(app)/clients/client-form";
import { ErrorConsoleLogger } from "@/app/(app)/clients/new/error-console-logger";
import { createClient as createServerClient } from "@/lib/supabase/server";

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
  async function createClient(formData: FormData) {
    "use server";

    const supabase = await createServerClient();

    const { data: agency } = await supabase
      .from("agencies")
      .select("id")
      .limit(1)
      .single();

    const { error } = await supabase
      .from("clients")
      .insert({
        agency_id: agency?.id,
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        business_name: formData.get("business_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        zip: formData.get("zip") as string,
      });

    if (error) {
      throw new Error(error.message);
    }

    redirect("/clients");
  }

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
      <ClientForm createAction={createClient} />
    </section>
  );
}
