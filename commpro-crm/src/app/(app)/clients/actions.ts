"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { getNullableString, getString } from "@/lib/form-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createClient(formData: FormData) {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
    console.error("[clients.createClient] Missing Supabase environment variables", {
      hasSupabaseUrl,
      hasSupabaseAnonKey,
    });
    redirect("/clients/new?error=supabase-env-missing");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[clients.createClient] Failed to validate auth session", {
      message: authError.message,
      code: authError.code,
      status: authError.status,
    });
    redirect("/clients/new?error=auth-session-invalid");
  }

  if (!user) {
    console.error("[clients.createClient] No authenticated user in session");
    redirect("/login");
  }

  const context = await getUserContext();
  const firstName = getString(formData, "first_name");

  if (!firstName) {
    redirect("/clients/new?error=first-name-required");
  }

  const {
    data: firstAgencyRows,
    error: agenciesError,
    count: agenciesCount,
  } = await supabase
    .from("agencies")
    .select("id", { count: "exact" })
    .limit(1);

  if (agenciesError) {
    console.error("[clients.createClient] Failed to read agencies table", {
      message: agenciesError.message,
      code: agenciesError.code,
      details: agenciesError.details,
      hint: agenciesError.hint,
    });
    redirect("/clients/new?error=agency-lookup-failed");
  }

  let agencyId = context.agencyId;

  if (!agencyId) {
    const firstAgency = firstAgencyRows?.[0];
    if (firstAgency?.id) {
      agencyId = String(firstAgency.id);
    }
  }

  if (!agenciesCount) {
    console.error("[clients.createClient] Agencies table has no rows");
    redirect("/clients/new?error=no-agency");
  }

  if (!agencyId) {
    console.error("[clients.createClient] Unable to resolve agency_id for insert", {
      userId: context.userId,
      contextAgencyId: context.agencyId,
      agenciesCount,
    });
    redirect("/clients/new?error=no-agency");
  }

  const payload = {
    agency_id: agencyId,
    owner_id: context.userId,
    first_name: firstName,
    last_name: getNullableString(formData, "last_name"),
    business_name: getNullableString(formData, "business_name"),
    email: getNullableString(formData, "email"),
    phone: getNullableString(formData, "phone"),
    address: getNullableString(formData, "address"),
    city: getNullableString(formData, "city"),
    state: getNullableString(formData, "state"),
    zip: getNullableString(formData, "zip"),
  };

  const { error } = await supabase.from("clients").insert(payload);
  if (error) {
    console.error("[clients.createClient] Supabase insert failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      payload,
    });
    redirect(`/clients/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const context = await getUserContext();
  const id = getString(formData, "id");

  const payload = {
    first_name: getNullableString(formData, "first_name"),
    last_name: getNullableString(formData, "last_name"),
    business_name: getNullableString(formData, "business_name"),
    email: getNullableString(formData, "email"),
    phone: getNullableString(formData, "phone"),
    address: getNullableString(formData, "address"),
    city: getNullableString(formData, "city"),
    state: getNullableString(formData, "state"),
    zip: getNullableString(formData, "zip"),
  };

  let query = supabase
    .from("clients")
    .update(payload)
    .eq("id", id);

  query = context.agencyId ? query.eq("agency_id", context.agencyId) : query.eq("owner_id", context.userId);

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/policies");
  redirect("/clients");
}

export async function deleteClient(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const context = await getUserContext();
  const id = getString(formData, "id");

  let query = supabase
    .from("clients")
    .delete()
    .eq("id", id);

  query = context.agencyId ? query.eq("agency_id", context.agencyId) : query.eq("owner_id", context.userId);

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/policies");
  redirect("/clients");
}
