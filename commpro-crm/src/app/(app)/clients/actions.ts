"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { getNullableString, getString } from "@/lib/form-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createClient(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const context = await getUserContext();

  let agencyId = context.agencyId;

  if (!agencyId) {
    const { data: firstAgency } = await supabase
      .from("agencies")
      .select("id")
      .eq("account_id", context.accountId)
      .limit(1)
      .maybeSingle();

    agencyId = firstAgency?.id ? String(firstAgency.id) : null;
  }

  if (!agencyId) {
    throw new Error("No agency is configured for this account.");
  }

  const payload = {
    agency_id: agencyId,
    owner_id: context.userId,
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

  const { error } = await supabase.from("clients").insert(payload);
  if (error) {
    throw new Error(error.message);
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
