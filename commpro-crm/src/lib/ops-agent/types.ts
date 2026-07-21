export type OpsTrigger = "manual" | "cron" | "api";
export type OpsMode = "dry_run" | "apply";

export type OpsFindingSeverity = "info" | "warning" | "error";

export type OpsFinding = {
  id: string;
  checkId: string;
  severity: OpsFindingSeverity;
  title: string;
  detail: string;
  resourceType?: string;
  resourceId?: string;
  autoFixable: boolean;
  suggestedAction?: string;
};

export type OpsRepair = {
  findingId: string;
  checkId: string;
  action: string;
  ok: boolean;
  detail: string;
  resourceType?: string;
  resourceId?: string;
};

export type OpsRunResult = {
  accountId: string;
  agencyId: string | null;
  trigger: OpsTrigger;
  mode: OpsMode;
  status: "completed" | "failed";
  findings: OpsFinding[];
  repairs: OpsRepair[];
  summary: string;
  errorMessage?: string;
  startedAt: string;
  finishedAt: string;
  runId?: string;
};

export type OpsAccountScope = {
  accountId: string;
  agencyId: string | null;
};
