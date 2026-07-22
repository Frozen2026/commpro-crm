"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { isMissingColumnError } from "@/lib/clients-query";
import { getNullableNumber, getNullableString, getString } from "@/lib/form-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function createPolicy(formData: FormData) {
  const context = await getUserContext();
  const admin = getSupabaseAdmin();

  if (!context.agencyId) {
    throw new Error("No agency is configured for this account.");
  }

  const clientId = getString(formData, "client_id");
  if (!clientId) {
    throw new Error("Client is required.");
  }

  const basePayload = {
    agency_id: context.agencyId,
    client_id: clientId,
    carrier_name: getString(formData, "carrier_name"),
    policy_number: getNullableString(formData, "policy_number"),
    line_of_business: getString(formData, "line_of_business"),
    premium: getNullableNumber(formData, "premium") ?? 0,
    status: getString(formData, "status") || "pending",
    effective_date: getNullableString(formData, "effective_date"),
    expiration_date: getNullableString(formData, "expiration_date"),
  };

  let { error } = await admin.from("policies").insert({
    ...basePayload,
    account_id: context.accountId,
  });

  if (error && isMissingColumnError(error.message)) {
    const retry = await admin.from("policies").insert(basePayload);
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/policies");
  redirect("/policies");
}

export async function updatePolicy(formData: FormData) {
  const context = await getUserContext();
  const admin = getSupabaseAdmin();
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

  let { error } = await admin
    .from("policies")
    .update(payload)
    .eq("id", id)
    .eq("account_id", context.accountId);

  if (error && isMissingColumnError(error.message)) {
    let q = admin.from("policies").update(payload).eq("id", id);
    if (context.agencyId) {
      q = q.eq("agency_id", context.agencyId);
    }
    const retry = await q;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/policies");
  redirect("/policies");
}

export async function deletePolicy(formData: FormData) {
  const context = await getUserContext();
  const admin = getSupabaseAdmin();
  const id = getString(formData, "id");

  let { error } = await admin
    .from("policies")
    .delete()
    .eq("id", id)
    .eq("account_id", context.accountId);

  if (error && isMissingColumnError(error.message)) {
    let q = admin.from("policies").delete().eq("id", id);
    if (context.agencyId) {
      q = q.eq("agency_id", context.agencyId);
    }
    const retry = await q;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/policies");
  redirect("/policies");
}
