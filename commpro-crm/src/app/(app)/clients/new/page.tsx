import Link from "next/link";

import { ClientForm } from "@/app/(app)/clients/client-form";
import { ErrorConsoleLogger } from "@/app/(app)/clients/new/error-console-logger";
import { WorkspaceSetupSqlCopy } from "@/app/(app)/clients/new/workspace-setup-sql-copy";

type NewClientPageProps = {
  searchParams?: Promise<{
    error?: string;
    supabase_error?: string;
  }>;
};

function getErrorMessage(error: string | undefined) {
  if (!error) {
    return null;
  }

  if (error === "agency-not-found" || error === "no-agency") {
    return "Could not prepare your workspace automatically. Please try again.";
  }

  if (error === "first-name-required") {
    return "First name is required.";
  }

  if (error === "insert-failed") {
    return "Client insert failed. Please verify the fields and try again.";
  }

  try {
    return decodeURIComponent(error);
  } catch {
    return error;
  }
}

function parseSupabaseError(raw: string | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
      status?: number;
    };
  } catch {
    return null;
  }
}

export default async function NewClientPage({ searchParams }: NewClientPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = getErrorMessage(params?.error);
  const supabaseError = parseSupabaseError(params?.supabase_error);
  const needsSqlSetup =
    Boolean(errorMessage?.toLowerCase().includes("sql")) ||
    Boolean(errorMessage?.toLowerCase().includes("account_id")) ||
    Boolean(errorMessage?.toLowerCase().includes("schema cache")) ||
    Boolean(errorMessage?.toLowerCase().includes("create_client_for_user")) ||
    Boolean(errorMessage?.toLowerCase().includes("workspace"));

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <ErrorConsoleLogger error={errorMessage} supabaseError={supabaseError} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">New Client</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a client to your account. Admins can create clients without setting up an agency first.
          </p>
        </div>
        <Link href="/clients" className="text-sm font-medium text-[var(--primary)]">
          Back to Clients
        </Link>
      </div>

      {errorMessage ? (
        <div className="space-y-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
          <p>{errorMessage}</p>
          {needsSqlSetup ? (
            <div className="space-y-3 rounded border border-rose-200 bg-white/70 p-3 text-slate-800">
              <p className="font-semibold">One-time database setup</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>
                  Click <strong>Copy setup SQL</strong> below
                </li>
                <li>
                  In Supabase → SQL Editor, open a <strong>new blank</strong> query (discard any old
                  pasted script)
                </li>
                <li>Paste → Run. Success shows a <code className="text-xs">workspace</code> JSON row</li>
                <li>Return here and create the client again</li>
              </ol>
              <WorkspaceSetupSqlCopy />
            </div>
          ) : null}
        </div>
      ) : null}

      <ClientForm />
    </section>
  );
}
