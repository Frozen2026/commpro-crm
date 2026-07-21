import type { IvansParseResult } from "@/lib/ivans/types";
import { parseIvansCsv } from "@/lib/ivans/parse-csv";
import { parseIvansAl3 } from "@/lib/ivans/parse-al3";
import { parseIvansJson } from "@/lib/ivans/parse-json";

function looksLikeAl3(text: string): boolean {
  const head = text.slice(0, 800);
  return /1MHG|2TRG|2PCG|2PIG|2BIS|2TCG/.test(head);
}

function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith("{") || t.startsWith("[");
}

function isZipMagic(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/**
 * Detect and parse IVANS / Policy Center download content.
 * Supports CSV/TSV, JSON, and best-effort AL3. Excel (.xlsx) → export as CSV.
 */
export function parseIvansDownload(
  content: string,
  filenameHint?: string
): IvansParseResult {
  const name = (filenameHint || "").toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return {
      format: "unknown",
      policies: [],
      warnings: [
        "Excel files are not parsed directly. In Policy Center, export as CSV (or Save As CSV) and upload that file.",
      ],
    };
  }

  if (name.endsWith(".json") || looksLikeJson(content)) {
    return parseIvansJson(content);
  }

  if (
    name.endsWith(".al3") ||
    name.endsWith(".afi") ||
    looksLikeAl3(content)
  ) {
    const result = parseIvansAl3(content);
    if (result.policies.length) {
      return {
        ...result,
        warnings: [
          "AL3 parsing is best-effort for common policy groups. Review imported rows.",
          ...result.warnings,
        ],
      };
    }
    return result;
  }

  if (
    name.endsWith(".csv") ||
    name.endsWith(".tsv") ||
    name.endsWith(".txt") ||
    content.includes(",") ||
    content.includes("\t")
  ) {
    // Plain .txt that isn't AL3 → try CSV/TSV
    if (name.endsWith(".txt") && looksLikeAl3(content)) {
      return parseIvansAl3(content);
    }
    return parseIvansCsv(content);
  }

  return {
    format: "unknown",
    policies: [],
    warnings: [
      "Unrecognized file format. Upload a Policy Center CSV/TSV export, AL3 download, or JSON array of policies.",
    ],
  };
}

/** Decode binary download (zip/xlsx/text) into parseable text when possible. */
export function decodeIvansFileBody(
  body: ArrayBuffer,
  filenameHint?: string
): { text: string; filename?: string; warnings: string[] } {
  const bytes = new Uint8Array(body);
  const name = (filenameHint || "").toLowerCase();
  const warnings: string[] = [];

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || isZipMagic(bytes)) {
    // Could be xlsx or IVANS zip-compressed AL3 — surface guidance
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      return {
        text: "",
        filename: filenameHint,
        warnings: [
          "Excel workbook detected. Export from Policy Center as CSV and re-upload.",
        ],
      };
    }
    warnings.push(
      "Compressed (ZIP) payload detected. If this is an IVANS mailbox file, decompress locally and upload the inner CSV/AL3, or configure the API for uncompressed downloads."
    );
    return { text: "", filename: filenameHint, warnings };
  }

  const text = new TextDecoder("utf-8").decode(bytes);
  return { text, filename: filenameHint, warnings };
}
