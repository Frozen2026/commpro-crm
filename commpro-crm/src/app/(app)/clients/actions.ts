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
 * Admins/owners should never be blocked by a missing agency row.
 * Resolves (or creates) account + agency via service role so RLS cannot stop client CRUD.
 */
async function ensureAccountAndAgency(userId: string, preferredAccountId: string, preferredAgencyId: string | null) {
  const admin = getSupabaseAdmin();

  let accountId = preferredAccountId;

  const { data: membership } = await admin
    .from("accounts_memberships")
    .select("account_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership?.account_id) {
    accountId = String(membership.account_id);
  } else {
    const { data: existingAccount } = await admin
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .maybeSingle();

    if (!existingAccount?.id) {
      const { data: createdAccount, error: accountError } = await admin
        .from("accounts")
        .insert({
          name: "CommPro Account",
          primary_owner_user_id: userId,
          is_personal_account: false,
        })
        .select("id")
        .single();

      if (accountError || !createdAccount?.id) {
        // Fallback: use any existing account in the system (common on admin bootstraps)
        const { data: anyAccount } = await admin
          .from("accounts")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (!anyAccount?.id) {
          throw new Error(
            accountError?.message || "Unable to resolve or create an account for client management.",
          );
        }
        accountId = String(anyAccount.id);
      } else {
        accountId = String(createdAccount.id);
      }

      // Best-effort membership so future context resolves cleanly
      await admin.from("accounts_memberships").upsert(
        {
          user_id: userId,
          account_id: accountId,
          account_role: "owner",
        },
        { onConflict: "user_id,account_id" },
      ).then(({ error }) => {
        if (error) {
          console.warn("[clients.ensureAccountAndAgency] membership upsert skipped", error.message);
        }
      });
    }
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
        throw new Error(agencyError?.message || "Unable to create a default agency for this account.");
      }
      agencyId = String(createdAgency.id);
    }
  }

  // Keep agent_profiles in sync when present (non-blocking)
  const { error: profileError } = await admin.from("agent_profiles").upsert(
    {
      id: userId,
      account_id: accountId,
      agency_id: agencyId,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    console.warn("[clients.ensureAccountAndAgency] agent_profiles upsert skipped", profileError.message);
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

  const { accountId, agencyId } = await ensureAccountAndAgency(
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
      details: error.details,
      hint: error.hint,
      clientId: id,
      payload,
      userId: context.userId,
      agencyId,
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
      code: error.code,
      details: error.details,
      hint: error.hint,
      clientId: id,
      userId: context.userId,
      accountId,
    });
    throw new Error(`Supabase delete failed: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/policies");
  redirect("/clients");
}
