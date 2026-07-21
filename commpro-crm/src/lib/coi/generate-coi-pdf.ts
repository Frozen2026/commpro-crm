import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type CoiPolicyLine = {
  policy_number: string | null;
  carrier_name: string | null;
  line_of_business: string | null;
  effective_date: string | null;
  expiration_date: string | null;
};

export type CoiPdfInput = {
  insuredName: string;
  requesterName?: string;
  requesterPhone?: string;
  requesterEmail?: string;
  certificateHolderName: string;
  certificateHolderAddress?: string;
  certificateHolderEmail?: string;
  policies: CoiPolicyLine[];
  notes?: string;
};

export async function generateCoiPdfBytes(input: CoiPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 760;
  const lineGap = 16;

  const draw = (text: string, opts?: { bold?: boolean; size?: number; x?: number }) => {
    const size = opts?.size ?? 11;
    const useFont = opts?.bold ? boldFont : font;
    const x = opts?.x ?? 40;
    // pdf-lib throws on some unicode; keep ASCII-ish.
    const safe = text.replace(/[^\x20-\x7E]/g, "-");
    page.drawText(safe.slice(0, 100), {
      x,
      y,
      size,
      font: useFont,
      color: opts?.bold && size >= 18 ? rgb(0.145, 0.388, 0.922) : rgb(0.1, 0.1, 0.1),
    });
    y -= lineGap + (opts?.size && opts.size > 12 ? 6 : 0);
  };

  draw("Certificate of Insurance", { bold: true, size: 20 });
  y -= 6;

  draw(`Insured / Named Insured: ${input.insuredName || "N/A"}`);
  draw(`Requester: ${input.requesterName || "N/A"}`);
  draw(`Requester Phone: ${input.requesterPhone || "N/A"}`);
  draw(`Requester Email: ${input.requesterEmail || "N/A"}`);
  draw(`Certificate Holder: ${input.certificateHolderName}`);
  draw(`Certificate Holder Email: ${input.certificateHolderEmail || "N/A"}`);
  draw(`Certificate Holder Address: ${input.certificateHolderAddress || "N/A"}`);

  y -= 6;
  draw("Active Policies", { bold: true, size: 13 });
  y -= 2;

  if (!input.policies.length) {
    draw("No active policies on file.", { x: 48 });
  } else {
    for (const policy of input.policies) {
      const line = `${policy.policy_number ?? "No Number"} | ${policy.carrier_name ?? "Unknown Carrier"} | ${policy.line_of_business ?? "-"} | ${policy.effective_date ?? "-"} to ${policy.expiration_date ?? "-"}`;
      draw(`• ${line}`, { size: 10, x: 48 });
      if (y < 60) break;
    }
  }

  if (input.notes?.trim()) {
    y -= 8;
    draw("Special Instructions / Additional Insured", { bold: true, size: 12 });
    draw(input.notes.trim(), { size: 10, x: 48 });
  }

  y = 40;
  page.drawText(`Generated ${new Date().toISOString().slice(0, 10)} · Commercial Pro`, {
    x: 40,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });

  const bytes = await pdf.save();
  return new Uint8Array(bytes);
}

export function pdfBytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
