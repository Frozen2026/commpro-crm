"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { getNullableNumber, getNullableString, getString } from "@/lib/form-utils";
import { createClient } from "@/lib/supabase/server";

export async function createPolicy(formData: FormData) {
  const supabase = await createClient();
  const context = await getUserContext();

  if (!context.agencyId) {
    throw new Error("No agency is configured for this account.");
  }

  const payload = {
    account_id: context.accountId,
    agency_id: context.agencyId,
    client_id: getString(formData, "client_id"),
    carrier_name: getString(formData, "carrier_name"),
    policy_number: getNullableString(formData, "policy_number"),
    line_of_business: getString(formData, "line_of_business"),
    premium: getNullableNumber(formData, "premium") ?? 0,
    status: getString(formData, "status") || "pending",
    effective_date: getNullableString(formData, "effective_date"),
    expiration_date: getNullableString(formData, "expiration_date"),
  };

  const { error } = await supabase.from("policies").insert(payload);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/policies");
  redirect("/policies");
}

export async function updatePolicy(formData: FormData) {
  const supabase = await createClient();
  const context = await getUserContext();
  const id = getString(formData, "id");

  const payload = {
    client_id: getString(formData, "client_id"),
    carrier_name: getString(formData, "carrier_name"),
    policy_number: getNullableString(formData, "policy_number"),
    line_of_business: getString(formData, "line_of_business"),
    premium: getNullableNumber(formData, "premium") ?? 0,
    status: getString(formData, "status") || "pending",
    effective_date: getNullableString(formData, "effective_date"),
    expiration_date: getNullableString(formData, "expiration_date"),
  };

  const { error } = await supabase
    .from("policies")
    .update(payload)
    .eq("id", id)
    .eq("account_id", context.accountId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/policies");
  redirect("/policies");
}

export async function deletePolicy(formData: FormData) {
  const supabase = await createClient();
  const context = await getUserContext();
  const id = getString(formData, "id");

  const { error } = await supabase
    .from("policies")
    .delete()
    .eq("id", id)
    .eq("account_id", context.accountId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/policies");
  redirect("/policies");
}
