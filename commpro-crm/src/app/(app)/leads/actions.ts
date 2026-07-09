"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { getNullableNumber, getNullableString, getString } from "@/lib/form-utils";
import { createClient } from "@/lib/supabase/server";

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const context = await getUserContext();

  if (!context.agencyId) {
    throw new Error("No agency is configured for this account.");
  }

  const payload = {
    account_id: context.accountId,
    agency_id: context.agencyId,
    owner_id: context.userId,
    first_name: getString(formData, "first_name"),
    last_name: getNullableString(formData, "last_name"),
    business_name: getNullableString(formData, "business_name"),
    email: getNullableString(formData, "email"),
    phone: getNullableString(formData, "phone"),
    source: getNullableString(formData, "source"),
    stage: getString(formData, "stage") || "new",
    line_of_business: getNullableString(formData, "line_of_business"),
    estimated_premium: getNullableNumber(formData, "estimated_premium"),
  };

  const { error } = await supabase.from("leads").insert(payload);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect("/leads");
}

export async function updateLead(formData: FormData) {
  const supabase = await createClient();
  const context = await getUserContext();
  const id = getString(formData, "id");

  const payload = {
    first_name: getString(formData, "first_name"),
    last_name: getNullableString(formData, "last_name"),
    business_name: getNullableString(formData, "business_name"),
    email: getNullableString(formData, "email"),
    phone: getNullableString(formData, "phone"),
    source: getNullableString(formData, "source"),
    stage: getString(formData, "stage") || "new",
    line_of_business: getNullableString(formData, "line_of_business"),
    estimated_premium: getNullableNumber(formData, "estimated_premium"),
  };

  const { error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .eq("account_id", context.accountId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect("/leads");
}
