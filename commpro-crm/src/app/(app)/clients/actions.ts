"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserContext } from "@/lib/account-context";
import { getNullableString, getString } from "@/lib/form-utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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

function isMissingTableError(message?: string | null) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("schema cache") || m.includes("could not find the table");
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

/**
 * Resolve account_id without touching public.accounts.
 * Production PostgREST often does not expose MakerKit's accounts table
 * ("Could not find the table 'public.accounts' in the schema cache").
 */
async function resolveAccountId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: { from: (table: string) => any },
  userId: string,
  preferredAccountId: string,
): Promise<string> {
  // 1) Memberships (MakerKit) when exposed
  {
    const { data, error } = await admin
      .from("accounts_memberships")
      .select("account_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!error && data?.account_id) {
      return String(data.account_id);
    }
    if (error && !isMissingTableError(error.message)) {
      console.warn("[clients.resolveAccountId] memberships lookup", error.message);
    }
  }

  // 2) Agent profile
  {
    const { data, error } = await admin
      .from("agent_profiles")
      .select("account_id")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data?.account_id) {
      return String(data.account_id);
    }
  }

  // 3) Preferred id if already used by agencies/clients/leads
  if (preferredAccountId) {
    for (const table of ["agencies", "clients", "leads"] as const) {
      const { data, error } = await admin
        .from(table)
        .select("id")
        .eq("account_id", preferredAccountId)
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) {
        return preferredAccountId;
      }
    }
  }

  // 4) Explicit env bootstrap (same pattern as COI intake)
  const envAccount =
    process.env.DEFAULT_ACCOUNT_ID?.trim() ||
    process.env.COI_INTAKE_ACCOUNT_ID?.trim() ||
    "";
  if (envAccount) {
    return envAccount;
  }

  // 5) Borrow any existing agency/client account in the project
  for (const table of ["agencies", "clients", "leads"] as const) {
    const { data, error } = await admin
      .from(table)
      .select("account_id")
      .not("account_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (!error && data?.account_id) {
      return String(data.account_id);
    }
  }

  throw new Error(
    "Unable to resolve account_id. Set DEFAULT_ACCOUNT_ID (or COI_INTAKE_ACCOUNT_ID) in the environment.",
  );
}

/**
 * Resolve or create account + agency.
 * Prefers SQL RPC (bypasses PostgREST schema cache for public.accounts).
 */
async function ensureAccountAndAgency(
  userId: string,
  preferredAccountId: string,
  preferredAgencyId: string | null,
) {
  const admin = getSupabaseAdmin();

  // 1) Preferred path: security-definer RPC in Postgres
  {
    const { data, error } = await admin.rpc("ensure_workspace_for_user", {
      p_user_id: userId,
    });

    if (!error && data) {
      const payload =
        typeof data === "object" && data !== null
          ? (data as { account_id?: string; agency_id?: string })
          : null;
      if (payload?.account_id && payload?.agency_id) {
        return {
          accountId: String(payload.account_id),
          agencyId: String(payload.agency_id),
        };
      }
    }

    if (error) {
      console.warn(
        "[clients.ensureAccountAndAgency] RPC unavailable, falling back",
        error.message,
      );
    }
  }

  // 2) Fallback without querying public.accounts via REST
  let accountId: string;
  try {
    accountId = await resolveAccountId(admin, userId, preferredAccountId);
  } catch (err) {
    throw new Error(
      `${err instanceof Error ? err.message : "Unable to resolve account_id."} ` +
        "Also run SQL migration 20260722010000_ensure_workspace_for_user.sql in the Supabase SQL editor.",
    );
  }

  let agencyId = preferredAgencyId;

  if (agencyId) {
    const { data: preferredAgency } = await admin
      .from("agencies")
      .select("id")
      .eq("id", agencyId)
      .maybeSingle();
    if (!preferredAgency?.id) {
      agencyId = null;
    }
  }

  if (!agencyId) {
    const { data: existingAgency } = await admin
      .from("agencies")
      .select("id")
      .eq("account_id", accountId)
      .limit(1)
      .maybeSingle();

    if (existingAgency?.id) {
      agencyId = String(existingAgency.id);
    } else {
      const envAgency =
        process.env.DEFAULT_AGENCY_ID?.trim() ||
        process.env.COI_INTAKE_AGENCY_ID?.trim() ||
        "";

      if (envAgency) {
        agencyId = envAgency;
      } else {
        const { data: createdAgency, error: agencyError } = await admin
          .from("agencies")
          .insert({
            account_id: accountId,
            name: "Default Agency",
            status: "active",
          })
          .select("id")
          .single();

        if (agencyError || !createdAgency?.id) {
          const { data: anyAgency } = await admin
            .from("agencies")
            .select("id, account_id")
            .limit(1)
            .maybeSingle();

          if (anyAgency?.id) {
            return {
              accountId: anyAgency.account_id
                ? String(anyAgency.account_id)
                : accountId,
              agencyId: String(anyAgency.id),
            };
          }

          throw new Error(
            agencyError?.message ||
              "Unable to create a default agency. Run ensure_workspace_for_user SQL or set DEFAULT_AGENCY_ID.",
          );
        }
        agencyId = String(createdAgency.id);
      }
    }
  }

  const { error: profileError } = await admin.from("agent_profiles").upsert(
    {
      id: userId,
      account_id: accountId,
      agency_id: agencyId,
    },
    { onConflict: "id" },
  );
  if (profileError && !isMissingTableError(profileError.message)) {
    console.warn(
      "[clients.ensureAccountAndAgency] agent_profiles upsert skipped",
      profileError.message,
    );
  }

  return { accountId, agencyId };
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
  const firstName = getString(formData, "first_name");

  if (!firstName) {
    redirect("/clients/new?error=first-name-required");
  }

  let accountId = context.accountId;
  let agencyId = context.agencyId;

  try {
    const resolved = await ensureAccountAndAgency(
      authenticatedUser.id,
      context.accountId,
      context.agencyId,
    );
    accountId = resolved.accountId;
    agencyId = resolved.agencyId;
  } catch (err) {
    console.error("[clients.createClient] Failed to ensure account/agency", err);
    redirect(
      `/clients/new?error=${encodeURIComponent(
        err instanceof Error ? err.message : "Unable to prepare account for client create.",
      )}`,
    );
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

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("clients").insert({
    agency_id: agencyId,
    account_id: accountId,
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
      agencyId,
      accountId,
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
  const authenticatedUser = await requireAuthenticatedUser("updateClient");
  const context = await getUserContext();
  const id = getString(formData, "id");
  const admin = getSupabaseAdmin();

  const { accountId } = await ensureAccountAndAgency(
    authenticatedUser.id,
    context.accountId,
    context.agencyId,
  );

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

  const { error } = await admin
    .from("clients")
    .update(payload)
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) {
    console.error("[clients.updateClient] Supabase update failed", {
      rawError: JSON.stringify(error),
      message: error.message,
      code: error.code,
      clientId: id,
      accountId,
    });
    throw new Error(`Supabase update failed: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/policies");
  redirect("/clients");
}

export async function deleteClient(formData: FormData) {
  const authenticatedUser = await requireAuthenticatedUser("deleteClient");
  const context = await getUserContext();
  const id = getString(formData, "id");
  const admin = getSupabaseAdmin();

  const { accountId } = await ensureAccountAndAgency(
    authenticatedUser.id,
    context.accountId,
    context.agencyId,
  );

  const { error } = await admin
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) {
    console.error("[clients.deleteClient] Supabase delete failed", {
      rawError: JSON.stringify(error),
      message: error.message,
      clientId: id,
      accountId,
    });
    throw new Error(`Supabase delete failed: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/policies");
  redirect("/clients");
}
