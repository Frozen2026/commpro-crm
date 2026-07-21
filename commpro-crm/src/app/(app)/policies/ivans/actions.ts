"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/lib/account-context";
import {
  buildIvansConfig,
  downloadIvansFile,
  isIvansConfigured,
  listIvansMailboxFiles,
} from "@/lib/ivans/api-client";
import { decodeIvansFileBody, parseIvansDownload } from "@/lib/ivans/detect";
import { importIvansPolicies } from "@/lib/ivans/import-policies";
import type { IvansImportSummary, IvansMailboxFile } from "@/lib/ivans/types";
import { createClient } from "@/lib/supabase/server";

export type IvansActionResult = {
  ok: boolean;
  message: string;
  summary?: IvansImportSummary;
  format?: string;
  warnings?: string[];
  files?: IvansMailboxFile[];
};

async function requireAgencyContext() {
  const context = await getUserContext();
  if (!context.agencyId) {
    throw new Error("No agency is configured for this account. Create an agency first.");
  }
  return context;
}

export async function getIvansSyncStatus(): Promise<{
  configured: boolean;
  message: string;
}> {
  if (!isIvansConfigured()) {
    return {
      configured: false,
      message:
        "IVANS API env not set. Add IVANS_API_ROOT, IVANS_ACCOUNT, IVANS_USERID, and IVANS_ACCESS_TOKEN (or OAuth client credentials).",
    };
  }
  return {
    configured: true,
    message: "IVANS File Transfer API credentials detected.",
  };
}

export async function importIvansUpload(
  formData: FormData
): Promise<IvansActionResult> {
  try {
    const context = await requireAgencyContext();
    const supabase = await createClient();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "Choose a CSV, TSV, AL3, or JSON file to upload." };
    }

    if (file.size > 15 * 1024 * 1024) {
      return { ok: false, message: "File is too large (max 15MB)." };
    }

    const buffer = await file.arrayBuffer();
    const decoded = decodeIvansFileBody(buffer, file.name);
    if (!decoded.text) {
      return {
        ok: false,
        message: decoded.warnings[0] || "Could not read file contents.",
        warnings: decoded.warnings,
      };
    }

    const parsed = parseIvansDownload(decoded.text, file.name);
    if (!parsed.policies.length) {
      return {
        ok: false,
        message: "No policies found in file.",
        format: parsed.format,
        warnings: [...decoded.warnings, ...parsed.warnings],
      };
    }

    const summary = await importIvansPolicies({
      supabase,
      accountId: context.accountId,
      agencyId: context.agencyId!,
      ownerId: context.userId,
      policies: parsed.policies,
      source: "ivans-upload",
    });

    revalidatePath("/policies");
    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Imported ${summary.createdPolicies} new and updated ${summary.updatedPolicies} policies (${parsed.format}).`,
      summary,
      format: parsed.format,
      warnings: [...decoded.warnings, ...parsed.warnings, ...summary.errors],
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Import failed.",
    };
  }
}

export async function listIvansMailbox(): Promise<IvansActionResult> {
  try {
    await requireAgencyContext();
    const config = await buildIvansConfig();
    if (!config) {
      return {
        ok: false,
        message:
          "IVANS is not configured. Set IVANS_API_ROOT, IVANS_ACCOUNT, IVANS_USERID, and token env vars.",
      };
    }

    const files = await listIvansMailboxFiles(config);
    return {
      ok: true,
      message: files.length
        ? `Found ${files.length} file(s) in the IVANS mailbox.`
        : "Mailbox is empty.",
      files,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to list mailbox.",
    };
  }
}

export async function syncIvansMailboxFile(fileId: string): Promise<IvansActionResult> {
  try {
    const context = await requireAgencyContext();
    const supabase = await createClient();
    const config = await buildIvansConfig();
    if (!config) {
      return { ok: false, message: "IVANS is not configured." };
    }
    if (!fileId?.trim()) {
      return { ok: false, message: "Missing file id." };
    }

    const downloaded = await downloadIvansFile(config, fileId);
    const decoded = decodeIvansFileBody(downloaded.body, downloaded.filename);
    if (!decoded.text) {
      return {
        ok: false,
        message: decoded.warnings[0] || "Downloaded file could not be decoded as text.",
        warnings: decoded.warnings,
      };
    }

    const parsed = parseIvansDownload(decoded.text, downloaded.filename);
    if (!parsed.policies.length) {
      return {
        ok: false,
        message: "Downloaded file contained no parseable policies.",
        format: parsed.format,
        warnings: [...decoded.warnings, ...parsed.warnings],
      };
    }

    const summary = await importIvansPolicies({
      supabase,
      accountId: context.accountId,
      agencyId: context.agencyId!,
      ownerId: context.userId,
      policies: parsed.policies,
      source: "ivans-api",
    });

    revalidatePath("/policies");
    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Synced ${summary.createdPolicies} new / ${summary.updatedPolicies} updated from mailbox file.`,
      summary,
      format: parsed.format,
      warnings: [...decoded.warnings, ...parsed.warnings, ...summary.errors],
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Mailbox sync failed.",
    };
  }
}

export async function syncAllIvansMailbox(): Promise<IvansActionResult> {
  try {
    const context = await requireAgencyContext();
    const supabase = await createClient();
    const config = await buildIvansConfig();
    if (!config) {
      return { ok: false, message: "IVANS is not configured." };
    }

    const files = await listIvansMailboxFiles(config);
    if (!files.length) {
      return { ok: true, message: "Mailbox is empty — nothing to sync.", files };
    }

    const aggregate: IvansImportSummary = {
      createdClients: 0,
      updatedClients: 0,
      createdPolicies: 0,
      updatedPolicies: 0,
      skipped: 0,
      errors: [],
      policies: [],
    };
    const warnings: string[] = [];

    for (const file of files) {
      try {
        const downloaded = await downloadIvansFile(config, file.id);
        const decoded = decodeIvansFileBody(
          downloaded.body,
          downloaded.filename || file.filename
        );
        if (!decoded.text) {
          warnings.push(
            `${file.filename || file.id}: ${decoded.warnings[0] || "unreadable"}`
          );
          continue;
        }
        const parsed = parseIvansDownload(
          decoded.text,
          downloaded.filename || file.filename
        );
        warnings.push(...parsed.warnings.map((w) => `${file.filename || file.id}: ${w}`));
        if (!parsed.policies.length) continue;

        const summary = await importIvansPolicies({
          supabase,
          accountId: context.accountId,
          agencyId: context.agencyId!,
          ownerId: context.userId,
          policies: parsed.policies,
          source: "ivans-api-batch",
        });
        aggregate.createdClients += summary.createdClients;
        aggregate.updatedClients += summary.updatedClients;
        aggregate.createdPolicies += summary.createdPolicies;
        aggregate.updatedPolicies += summary.updatedPolicies;
        aggregate.skipped += summary.skipped;
        aggregate.errors.push(...summary.errors);
        aggregate.policies.push(...summary.policies);
      } catch (err) {
        warnings.push(
          `${file.filename || file.id}: ${err instanceof Error ? err.message : "failed"}`
        );
      }
    }

    revalidatePath("/policies");
    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Synced mailbox (${files.length} file(s)): ${aggregate.createdPolicies} created, ${aggregate.updatedPolicies} updated.`,
      summary: aggregate,
      warnings,
      files,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Batch sync failed.",
    };
  }
}
