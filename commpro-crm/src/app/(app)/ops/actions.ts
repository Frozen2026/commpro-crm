"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/lib/account-context";
import { runOpsBrain } from "@/lib/ops-agent/brain";
import type { OpsMode, OpsRunResult } from "@/lib/ops-agent/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function triggerOpsBrain(formData: FormData): Promise<OpsRunResult> {
  const context = await getUserContext();
  const modeRaw = String(formData.get("mode") || "apply");
  const mode: OpsMode = modeRaw === "dry_run" ? "dry_run" : "apply";

  const result = await runOpsBrain({
    db: supabaseAdmin,
    accountId: context.accountId,
    agencyId: context.agencyId,
    trigger: "manual",
    mode,
    persist: true,
  });

  revalidatePath("/ops");
  revalidatePath("/dashboard");
  revalidatePath("/policies");
  revalidatePath("/renewals");
  return result;
}

export async function getRecentOpsRuns(limit = 10) {
  const context = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ops_runs")
    .select(
      "id, trigger, mode, status, findings_count, repairs_count, summary, started_at, finished_at, error_message"
    )
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { runs: [], error: error.message };
  }

  return { runs: data ?? [], error: null as string | null };
}
