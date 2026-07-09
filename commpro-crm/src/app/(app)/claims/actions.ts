"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { getNullableNumber, getNullableString, getString } from "@/lib/form-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createClaim(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const context = await getUserContext();

  if (!context.agencyId) {
    throw new Error("No agency is configured for this account.");
  }

  const payload = {
    account_id: context.accountId,
    agency_id: context.agencyId,
    policy_id: getString(formData, "policy_id"),
    claim_number: getNullableString(formData, "claim_number"),
    date_of_loss: getString(formData, "date_of_loss"),
    description: getNullableString(formData, "description"),
    adjuster_name: getNullableString(formData, "adjuster_name"),
    adjuster_phone: getNullableString(formData, "adjuster_phone"),
    adjuster_email: getNullableString(formData, "adjuster_email"),
    status: getString(formData, "status") || "reported",
    reserve_amount: getNullableNumber(formData, "reserve_amount"),
    paid_amount: getNullableNumber(formData, "paid_amount") ?? 0,
  };

  const { error } = await supabase.from("claims").insert(payload);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/claims");
  redirect("/claims");
}

export async function updateClaim(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const context = await getUserContext();
  const id = getString(formData, "id");

  const payload = {
    policy_id: getString(formData, "policy_id"),
    claim_number: getNullableString(formData, "claim_number"),
    date_of_loss: getString(formData, "date_of_loss"),
    description: getNullableString(formData, "description"),
    adjuster_name: getNullableString(formData, "adjuster_name"),
    adjuster_phone: getNullableString(formData, "adjuster_phone"),
    adjuster_email: getNullableString(formData, "adjuster_email"),
    status: getString(formData, "status") || "reported",
    reserve_amount: getNullableNumber(formData, "reserve_amount"),
    paid_amount: getNullableNumber(formData, "paid_amount") ?? 0,
  };

  const { error } = await supabase
    .from("claims")
    .update(payload)
    .eq("id", id)
    .eq("account_id", context.accountId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/claims");
  redirect("/claims");
}

export async function deleteClaim(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const context = await getUserContext();
  const id = getString(formData, "id");

  const { error } = await supabase
    .from("claims")
    .delete()
    .eq("id", id)
    .eq("account_id", context.accountId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/claims");
  redirect("/claims");
}
