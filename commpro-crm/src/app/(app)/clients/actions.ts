"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { getNullableString, getString } from "@/lib/form-utils";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseErrorDetails = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
};

function encodeSupabaseErrorForQuery(error: SupabaseErrorDetails) {
  return encodeURIComponent(JSON.stringify(error));
}

async function requireAuthenticatedUser(actionName: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error(`[clients.${actionName}] Failed to validate auth session`, {
      message: authError.message,
      code: authError.code,
      status: authError.status,
    });
    redirect(
      `/clients/new?error=auth-session-invalid&supabase_error=${encodeSupabaseErrorForQuery({
        message: authError.message,
        code: authError.code,
        status: authError.status,
      })}`,
    );
  }

  if (!user) {
    console.error(`[clients.${actionName}] No authenticated user in session`);
    redirect("/login");
  }

  return user;
}

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

  const authenticatedUser = await requireAuthenticatedUser("createClient");

  const context = await getUserContext();
  const supabase = await createSupabaseServerClient();
  const firstName = getString(formData, "first_name");

  if (!firstName) {
    redirect("/clients/new?error=first-name-required");
  }

  const { data: agency, error: agenciesError } = await supabase
    .from("agencies")
    .select("id")
    .limit(1)
    .single();

  if (agenciesError) {
    console.error("[clients.createClient] Failed to read agencies table", {
      message: agenciesError.message,
      code: agenciesError.code,
      details: agenciesError.details,
      hint: agenciesError.hint,
    });
    redirect("/clients/new?error=agency-lookup-failed");
  }

  if (!agency?.id) {
    console.error("[clients.createClient] Unable to resolve agency_id for insert", {
      userId: context.userId,
      contextAgencyId: context.agencyId,
      agency,
    });
    redirect("/clients/new?error=no-agency");
  }

  const submittedValues = {
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

  const { error } = await supabase
    .from("clients")
    .insert({
      agency_id: agency.id,
      account_id: context.accountId,
      owner_id: authenticatedUser.id,
      first_name: submittedValues.first_name,
      last_name: submittedValues.last_name,
      business_name: submittedValues.business_name,
      email: submittedValues.email,
      phone: submittedValues.phone,
      address: submittedValues.address,
      city: submittedValues.city,
      state: submittedValues.state,
      zip: submittedValues.zip,
    });
  if (error) {
    const supabaseError = {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    };

    console.error("[clients.createClient] Supabase insert failed", {
      rawError: JSON.stringify(error),
      ...supabaseError,
      submittedValues,
      agencyId: agency.id,
      accountId: context.accountId,
      ownerId: authenticatedUser.id,
    });

    redirect(
      `/clients/new?error=${encodeURIComponent(error.message)}&supabase_error=${encodeSupabaseErrorForQuery(
        supabaseError,
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(formData: FormData) {
  await requireAuthenticatedUser("updateClient");
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

  let query = supabaseAdmin
    .from("clients")
    .update(payload)
    .eq("id", id);

  query = context.agencyId ? query.eq("agency_id", context.agencyId) : query.eq("owner_id", context.userId);

  const { error } = await query;

  if (error) {
    console.error("[clients.updateClient] Supabase update failed", {
      rawError: JSON.stringify(error),
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      clientId: id,
      payload,
      userId: context.userId,
      agencyId: context.agencyId,
    });
    throw new Error(`Supabase update failed: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/policies");
  redirect("/clients");
}

export async function deleteClient(formData: FormData) {
  await requireAuthenticatedUser("deleteClient");
  const context = await getUserContext();
  const id = getString(formData, "id");

  let query = supabaseAdmin
    .from("clients")
    .delete()
    .eq("id", id);

  query = context.agencyId ? query.eq("agency_id", context.agencyId) : query.eq("owner_id", context.userId);

  const { error } = await query;

  if (error) {
    console.error("[clients.deleteClient] Supabase delete failed", {
      rawError: JSON.stringify(error),
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      clientId: id,
      userId: context.userId,
      agencyId: context.agencyId,
    });
    throw new Error(`Supabase delete failed: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/policies");
  redirect("/clients");
}
