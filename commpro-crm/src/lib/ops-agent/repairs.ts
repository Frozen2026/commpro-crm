import type { OpsFinding, OpsRepair } from "@/lib/ops-agent/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = { from: (table: string) => any };

function daysFromNowIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function ensureTask(
  db: Db,
  params: {
    accountId: string;
    agencyId: string;
    title: string;
    relatedType: string;
    relatedId: string;
    dueDate: string;
    priority: "low" | "medium" | "high" | "urgent";
  }
): Promise<{ created: boolean; taskId?: string; error?: string }> {
  const { data: existing } = await db
    .from("tasks")
    .select("id")
    .eq("account_id", params.accountId)
    .eq("related_type", params.relatedType)
    .eq("related_id", params.relatedId)
    .eq("title", params.title)
    .in("status", ["open", "in_progress"])
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return { created: false, taskId: existing.id };
  }

  const { data, error } = await db
    .from("tasks")
    .insert({
      account_id: params.accountId,
      agency_id: params.agencyId,
      title: params.title,
      related_type: params.relatedType,
      related_id: params.relatedId,
      due_date: params.dueDate,
      status: "open",
      priority: params.priority,
    })
    .select("id")
    .single();

  if (error) return { created: false, error: error.message };
  return { created: true, taskId: data?.id };
}

async function writeAudit(
  db: Db,
  params: {
    accountId: string;
    agencyId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }
) {
  await db.from("audit_log").insert({
    account_id: params.accountId,
    agency_id: params.agencyId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: { source: "ops-brain", ...(params.metadata || {}) },
  });
}

/**
 * Apply only safe, reversible data-quality repairs for autoFixable findings.
 */
export async function applyOpsRepairs(params: {
  db: Db;
  accountId: string;
  agencyId: string;
  findings: OpsFinding[];
}): Promise<OpsRepair[]> {
  const { db, accountId, agencyId, findings } = params;
  const repairs: OpsRepair[] = [];

  for (const finding of findings) {
    if (!finding.autoFixable || !finding.resourceId) continue;

    try {
      if (finding.checkId === "stale_active_policy") {
        const { error } = await db
          .from("policies")
          .update({ status: "expired" })
          .eq("id", finding.resourceId)
          .eq("account_id", accountId)
          .eq("status", "active");

        if (error) {
          repairs.push({
            findingId: finding.id,
            checkId: finding.checkId,
            action: "set_policy_expired",
            ok: false,
            detail: error.message,
            resourceType: "policy",
            resourceId: finding.resourceId,
          });
        } else {
          await writeAudit(db, {
            accountId,
            agencyId,
            action: "ops.auto_expire_policy",
            resourceType: "policy",
            resourceId: finding.resourceId,
          });
          repairs.push({
            findingId: finding.id,
            checkId: finding.checkId,
            action: "set_policy_expired",
            ok: true,
            detail: "Status set to expired",
            resourceType: "policy",
            resourceId: finding.resourceId,
          });
        }
        continue;
      }

      if (finding.checkId === "missing_renewal") {
        const { data: policy } = await db
          .from("policies")
          .select("id, expiration_date")
          .eq("id", finding.resourceId)
          .eq("account_id", accountId)
          .maybeSingle();

        if (!policy?.id) {
          repairs.push({
            findingId: finding.id,
            checkId: finding.checkId,
            action: "create_renewal",
            ok: false,
            detail: "Policy not found",
            resourceType: "policy",
            resourceId: finding.resourceId,
          });
          continue;
        }

        const { data: existing } = await db
          .from("renewals")
          .select("id")
          .eq("policy_id", policy.id)
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          repairs.push({
            findingId: finding.id,
            checkId: finding.checkId,
            action: "create_renewal",
            ok: true,
            detail: "Renewal already existed",
            resourceType: "renewal",
            resourceId: existing.id,
          });
          continue;
        }

        const { data: created, error } = await db
          .from("renewals")
          .insert({
            policy_id: policy.id,
            renewal_date: policy.expiration_date || daysFromNowIso(30),
            status: "upcoming",
            ai_notes: "Created by Ops Brain (missing renewal window).",
          })
          .select("id")
          .single();

        if (error) {
          repairs.push({
            findingId: finding.id,
            checkId: finding.checkId,
            action: "create_renewal",
            ok: false,
            detail: error.message,
            resourceType: "policy",
            resourceId: finding.resourceId,
          });
        } else {
          await writeAudit(db, {
            accountId,
            agencyId,
            action: "ops.create_renewal",
            resourceType: "renewal",
            resourceId: created.id,
            metadata: { policyId: policy.id },
          });
          repairs.push({
            findingId: finding.id,
            checkId: finding.checkId,
            action: "create_renewal",
            ok: true,
            detail: "Upcoming renewal created",
            resourceType: "renewal",
            resourceId: created.id,
          });
        }
        continue;
      }

      if (finding.checkId === "overdue_renewal_no_task") {
        const task = await ensureTask(db, {
          accountId,
          agencyId,
          title: "Ops Brain: overdue renewal follow-up",
          relatedType: "renewal",
          relatedId: finding.resourceId,
          dueDate: daysFromNowIso(0),
          priority: "high",
        });
        repairs.push({
          findingId: finding.id,
          checkId: finding.checkId,
          action: "create_renewal_task",
          ok: !task.error,
          detail: task.error
            ? task.error
            : task.created
              ? "Created follow-up task"
              : "Open task already existed",
          resourceType: "renewal",
          resourceId: finding.resourceId,
        });
        if (task.created && task.taskId) {
          await writeAudit(db, {
            accountId,
            agencyId,
            action: "ops.create_task",
            resourceType: "task",
            resourceId: task.taskId,
            metadata: { relatedType: "renewal", relatedId: finding.resourceId },
          });
        }
        continue;
      }

      if (finding.checkId === "stale_coi_lead") {
        const task = await ensureTask(db, {
          accountId,
          agencyId,
          title: "Ops Brain: website COI lead needs response",
          relatedType: "lead",
          relatedId: finding.resourceId,
          dueDate: daysFromNowIso(0),
          priority: "urgent",
        });
        repairs.push({
          findingId: finding.id,
          checkId: finding.checkId,
          action: "create_coi_lead_task",
          ok: !task.error,
          detail: task.error
            ? task.error
            : task.created
              ? "Created urgent COI task"
              : "Open task already existed",
          resourceType: "lead",
          resourceId: finding.resourceId,
        });
        continue;
      }

      if (finding.checkId === "client_missing_contact") {
        const task = await ensureTask(db, {
          accountId,
          agencyId,
          title: "Ops Brain: collect client email/phone",
          relatedType: "client",
          relatedId: finding.resourceId,
          dueDate: daysFromNowIso(7),
          priority: "medium",
        });
        repairs.push({
          findingId: finding.id,
          checkId: finding.checkId,
          action: "create_contact_task",
          ok: !task.error,
          detail: task.error
            ? task.error
            : task.created
              ? "Created contact-collection task"
              : "Open task already existed",
          resourceType: "client",
          resourceId: finding.resourceId,
        });
      }
    } catch (err) {
      repairs.push({
        findingId: finding.id,
        checkId: finding.checkId,
        action: "unexpected",
        ok: false,
        detail: err instanceof Error ? err.message : "unknown error",
        resourceType: finding.resourceType,
        resourceId: finding.resourceId,
      });
    }
  }

  return repairs;
}
