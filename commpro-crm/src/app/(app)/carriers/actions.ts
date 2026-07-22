"use server";

import { revalidatePath } from "next/cache";

import { getNullableString, getString } from "@/lib/form-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const STANDARD_LINES_OF_BUSINESS = [
  "General Liability",
  "Auto",
  "Trucking",
  "Workers Compensation",
  "Property",
  "Umbrella",
  "Cyber",
  "Surety",
  "Specialty",
] as const;

const DEFAULT_CARRIERS: Array<{
  name: string;
  am_best_rating: string;
  lines_of_business: string[];
  writes_uiia: boolean;
  is_preferred: boolean;
}> = [
  { name: "Travelers", am_best_rating: "A++", lines_of_business: ["General Liability", "Auto", "Workers Compensation"], writes_uiia: true, is_preferred: true },
  { name: "The Hartford", am_best_rating: "A+", lines_of_business: ["General Liability", "Property", "Workers Compensation"], writes_uiia: true, is_preferred: true },
  { name: "Progressive Commercial", am_best_rating: "A+", lines_of_business: ["Auto", "Trucking"], writes_uiia: true, is_preferred: true },
  { name: "Liberty Mutual", am_best_rating: "A", lines_of_business: ["General Liability", "Property", "Auto"], writes_uiia: true, is_preferred: false },
  { name: "Chubb", am_best_rating: "A++", lines_of_business: ["General Liability", "Property", "Cyber"], writes_uiia: false, is_preferred: true },
  { name: "CNA", am_best_rating: "A", lines_of_business: ["General Liability", "Property", "Umbrella"], writes_uiia: true, is_preferred: false },
  { name: "Berkshire Hathaway Guard", am_best_rating: "A+", lines_of_business: ["Workers Compensation", "Property"], writes_uiia: false, is_preferred: false },
  { name: "AmTrust", am_best_rating: "A-", lines_of_business: ["Workers Compensation", "General Liability"], writes_uiia: true, is_preferred: false },
  { name: "Great West Casualty", am_best_rating: "A+", lines_of_business: ["Trucking", "Auto"], writes_uiia: true, is_preferred: true },
  { name: "Canal Insurance", am_best_rating: "A", lines_of_business: ["Trucking", "Auto"], writes_uiia: true, is_preferred: true },
  { name: "Old Republic", am_best_rating: "A+", lines_of_business: ["General Liability", "Auto", "Umbrella"], writes_uiia: true, is_preferred: false },
  { name: "RLI", am_best_rating: "A+", lines_of_business: ["Umbrella", "Surety"], writes_uiia: false, is_preferred: false },
  { name: "Markel", am_best_rating: "A", lines_of_business: ["Specialty", "General Liability"], writes_uiia: false, is_preferred: false },
  { name: "Nationwide", am_best_rating: "A+", lines_of_business: ["General Liability", "Property", "Auto"], writes_uiia: false, is_preferred: false },
  { name: "State Auto", am_best_rating: "A", lines_of_business: ["General Liability", "Property"], writes_uiia: false, is_preferred: false },
  { name: "Zurich", am_best_rating: "A+", lines_of_business: ["General Liability", "Property", "Auto"], writes_uiia: true, is_preferred: true },
  { name: "AIG", am_best_rating: "A", lines_of_business: ["General Liability", "Cyber", "Property"], writes_uiia: false, is_preferred: false },
  { name: "Hanover", am_best_rating: "A", lines_of_business: ["General Liability", "Property", "Auto"], writes_uiia: false, is_preferred: false },
  { name: "Auto-Owners", am_best_rating: "A++", lines_of_business: ["General Liability", "Property", "Auto"], writes_uiia: false, is_preferred: false },
  { name: "Sentry", am_best_rating: "A+", lines_of_business: ["Auto", "Workers Compensation"], writes_uiia: true, is_preferred: false },
  { name: "USLI", am_best_rating: "A++", lines_of_business: ["General Liability", "Specialty"], writes_uiia: false, is_preferred: false },
  { name: "Tokio Marine HCC", am_best_rating: "A++", lines_of_business: ["Specialty", "General Liability"], writes_uiia: false, is_preferred: false },
];

function parseLines(formData: FormData) {
  const selected = formData
    .getAll("lines_of_business")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  const custom = getString(formData, "custom_lines")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([...selected, ...custom]));
}

export async function createCarrier(formData: FormData) {
  const admin = getSupabaseAdmin();
  const name = getString(formData, "name");
  if (!name) {
    throw new Error("Carrier name is required.");
  }

  const { error } = await admin.from("insurance_carriers").insert({
    name,
    am_best_rating: getNullableString(formData, "am_best_rating"),
    lines_of_business: parseLines(formData),
    writes_uiia: formData.get("writes_uiia") === "on",
    is_preferred: formData.get("is_preferred") === "on",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/carriers");
  revalidatePath("/policies/new");
  revalidatePath("/policies");
}

export async function updateCarrier(formData: FormData) {
  const admin = getSupabaseAdmin();
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  if (!id) {
    throw new Error("Carrier id is required.");
  }
  if (!name) {
    throw new Error("Carrier name is required.");
  }

  const { error } = await admin
    .from("insurance_carriers")
    .update({
      name,
      am_best_rating: getNullableString(formData, "am_best_rating"),
      lines_of_business: parseLines(formData),
      writes_uiia: formData.get("writes_uiia") === "on",
      is_preferred: formData.get("is_preferred") === "on",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/carriers");
  revalidatePath("/policies/new");
  revalidatePath("/policies");
}

export async function deleteCarrier(formData: FormData) {
  const admin = getSupabaseAdmin();
  const id = getString(formData, "id");
  if (!id) {
    throw new Error("Carrier id is required.");
  }

  const { error } = await admin.from("insurance_carriers").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/carriers");
  revalidatePath("/policies/new");
  revalidatePath("/policies");
}

export async function seedDefaultCarriers() {
  const admin = getSupabaseAdmin();

  const { error } = await admin.from("insurance_carriers").upsert(DEFAULT_CARRIERS, {
    onConflict: "name",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/carriers");
  revalidatePath("/policies/new");
  revalidatePath("/policies");
}
