import type { IvansMailboxFile } from "@/lib/ivans/types";

/**
 * IVANS Exchange File Transfer API client (agency / AMS download side).
 *
 * Env (server-only):
 *   IVANS_API_ROOT            Exchange API root including /api, e.g. https://host/api
 *   IVANS_TOKEN_URL           OAuth token endpoint (optional if IVANS_ACCESS_TOKEN set)
 *   IVANS_CLIENT_ID
 *   IVANS_CLIENT_SECRET
 *   IVANS_ACCESS_TOKEN        Static bearer token (skips OAuth when set)
 *   IVANS_ACCOUNT             Exchange mailbox account
 *   IVANS_USERID              Exchange mailbox user id
 *   IVANS_CLIENT_INSTANCE_ID  GUID for AMS auto-update (optional)
 *   IVANS_VENDOR_COMPANY      X-IVANS-Vendor-Company (optional)
 *   IVANS_VENDOR_PRODUCT      X-IVANS-Vendor-Product (optional)
 *   IVANS_VENDOR_VERSION      X-IVANS-Vendor-Version (optional)
 *   IVANS_VENDOR_CUSTOMER_DATA
 *
 * Docs: GET {root}/files?account=&userid=  and GET {root}/files/{fileId}
 * Policy Download API is primarily carrier→mailbox; agencies pull via File Transfer.
 */

export type IvansFileMeta = IvansMailboxFile & {
  raw: Record<string, unknown>;
};

export type IvansApiConfig = {
  apiRoot: string;
  account: string;
  userid: string;
  accessToken: string;
  clientInstanceId?: string;
  vendorCompany?: string;
  vendorProduct?: string;
  vendorVersion?: string;
  vendorCustomerData?: string;
};

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export async function resolveIvansAccessToken(): Promise<string | null> {
  const staticToken = process.env.IVANS_ACCESS_TOKEN?.trim();
  if (staticToken) return staticToken;

  const tokenUrl = process.env.IVANS_TOKEN_URL?.trim();
  const clientId = process.env.IVANS_CLIENT_ID?.trim();
  const clientSecret = process.env.IVANS_CLIENT_SECRET?.trim();
  if (!tokenUrl || !clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IVANS token request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("IVANS token response missing access_token");
  }
  return json.access_token;
}

export async function buildIvansConfig(): Promise<IvansApiConfig | null> {
  const apiRoot = process.env.IVANS_API_ROOT?.trim();
  const account = process.env.IVANS_ACCOUNT?.trim();
  const userid = process.env.IVANS_USERID?.trim();
  if (!apiRoot || !account || !userid) return null;

  const accessToken = await resolveIvansAccessToken();
  if (!accessToken) return null;

  return {
    apiRoot: trimSlash(apiRoot),
    account,
    userid,
    accessToken,
    clientInstanceId: process.env.IVANS_CLIENT_INSTANCE_ID?.trim() || undefined,
    vendorCompany: process.env.IVANS_VENDOR_COMPANY?.trim() || "CommPro.ai",
    vendorProduct: process.env.IVANS_VENDOR_PRODUCT?.trim() || "CommPro CRM",
    vendorVersion: process.env.IVANS_VENDOR_VERSION?.trim() || "1.0",
    vendorCustomerData: process.env.IVANS_VENDOR_CUSTOMER_DATA?.trim() || undefined,
  };
}

function requestHeaders(config: IvansApiConfig): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${config.accessToken}`,
    Accept: "application/json",
    "X-IVANS-Client-Operating-System": process.platform,
  };
  if (config.clientInstanceId) {
    h["X-IVANS-Client-Instance-Id"] = config.clientInstanceId;
  }
  if (config.vendorCompany) h["X-IVANS-Vendor-Company"] = config.vendorCompany;
  if (config.vendorProduct) h["X-IVANS-Vendor-Product"] = config.vendorProduct;
  if (config.vendorVersion) h["X-IVANS-Vendor-Version"] = config.vendorVersion;
  if (config.vendorCustomerData) {
    h["X-IVANS-Vendor-Customer-Data"] = config.vendorCustomerData;
  }
  return h;
}

function mapFile(row: Record<string, unknown>): IvansFileMeta | null {
  const id = String(row.FileId ?? row.fileId ?? row.id ?? row.guid ?? "");
  if (!id) return null;
  return {
    id,
    filename: String(row.OriginalName ?? row.originalName ?? row.filename ?? row.name ?? "") || undefined,
    remoteName: String(row.RemoteName ?? row.remoteName ?? "") || undefined,
    size: typeof row.OriginalSize === "number" ? row.OriginalSize : typeof row.size === "number" ? row.size : undefined,
    compressedSize:
      typeof row.CompressedSize === "number"
        ? row.CompressedSize
        : typeof row.compressedSize === "number"
          ? row.compressedSize
          : undefined,
    receivedAt: String(row.StatusDate ?? row.statusDate ?? row.receivedAt ?? "") || undefined,
    classCode: String(row.ClassCode ?? row.classCode ?? "") || undefined,
    sendAccount: String(row.SendAccount ?? row.sendAccount ?? "") || undefined,
    raw: row,
  };
}

export async function listIvansMailboxFiles(
  config: IvansApiConfig
): Promise<IvansFileMeta[]> {
  const url = new URL(`${config.apiRoot}/files`);
  url.searchParams.set("account", config.account);
  url.searchParams.set("userid", config.userid);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: requestHeaders(config),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IVANS list files failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as unknown;
  const rows = Array.isArray(json)
    ? json
    : Array.isArray((json as { files?: unknown }).files)
      ? ((json as { files: unknown[] }).files)
      : Array.isArray((json as { data?: unknown }).data)
        ? ((json as { data: unknown[] }).data)
        : [];

  return rows
    .map((row) => mapFile((row || {}) as Record<string, unknown>))
    .filter((f): f is IvansFileMeta => Boolean(f));
}

export async function downloadIvansFile(
  config: IvansApiConfig,
  fileId: string
): Promise<{ filename?: string; contentType?: string; body: ArrayBuffer }> {
  // Docs: GET {root}/files/{FileId} (no account query on download)
  const url = `${config.apiRoot}/files/${encodeURIComponent(fileId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...requestHeaders(config),
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IVANS download failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const disposition = res.headers.get("content-disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(disposition);
  const filename = match?.[1] ? decodeURIComponent(match[1]) : undefined;

  return {
    filename,
    contentType: res.headers.get("content-type") || undefined,
    body: await res.arrayBuffer(),
  };
}

/** True when IVANS mailbox env is present (token may still be missing). */
export function isIvansConfigured(): boolean {
  return Boolean(
    process.env.IVANS_API_ROOT?.trim() &&
      process.env.IVANS_ACCOUNT?.trim() &&
      process.env.IVANS_USERID?.trim() &&
      (process.env.IVANS_ACCESS_TOKEN?.trim() ||
        (process.env.IVANS_TOKEN_URL?.trim() &&
          process.env.IVANS_CLIENT_ID?.trim() &&
          process.env.IVANS_CLIENT_SECRET?.trim()))
  );
}
