import {
  seedDefaultCarriers,
  STANDARD_LINES_OF_BUSINESS,
} from "@/app/(app)/carriers/actions";
import { CarrierEditorCard } from "@/app/(app)/carriers/carrier-editor-card";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type CarrierRow = {
  id: string;
  name: string;
  am_best_rating: string | null;
  lines_of_business: string[] | string | null;
  writes_uiia: boolean | null;
  is_preferred: boolean | null;
};

function normalizeLines(value: CarrierRow["lines_of_business"]) {
  if (Array.isArray(value)) {
    return value.filter((line): line is string => typeof line === "string" && line.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [] as string[];
}

export default async function CarriersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; line_of_business?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const selectedLine = (params.line_of_business ?? "").trim();

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("insurance_carriers")
    .select("id, name, am_best_rating, lines_of_business, writes_uiia, is_preferred")
    .order("name", { ascending: true });

  if (error) {
    console.error("[carriers.page] load failed", error.message);
  }

  const allCarriers = ((data ?? []) as CarrierRow[]).map((carrier) => ({
    ...carrier,
    lines: normalizeLines(carrier.lines_of_business),
  }));

  const carriers = allCarriers.filter((carrier) => {
    const matchesQuery =
      query.length === 0 || carrier.name.toLowerCase().includes(query.toLowerCase());
    const matchesLine =
      selectedLine.length === 0 ||
      carrier.lines.some((line) => line.toLowerCase() === selectedLine.toLowerCase());
    return matchesQuery && matchesLine;
  });

  const allLines = Array.from(
    new Set([
      ...STANDARD_LINES_OF_BUSINESS,
      ...allCarriers.flatMap((carrier) => carrier.lines),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Carriers</h2>
          <p className="mt-1 text-sm text-slate-600">
            Edit carrier details and lines of business. Changes appear in the policy carrier list.
          </p>
        </div>
        {allCarriers.length === 0 ? (
          <form action={seedDefaultCarriers}>
            <button
              type="submit"
              className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Load default carriers
            </button>
          </form>
        ) : null}
      </div>

      <form className="grid gap-3 rounded-xl border border-[var(--border)] bg-white p-4 md:grid-cols-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search carriers"
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
        />
        <select
          name="line_of_business"
          defaultValue={selectedLine}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm"
        >
          <option value="">All lines of business</option>
          {allLines.map((line) => (
            <option key={line} value={line}>
              {line}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Apply filters
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Add carrier</h3>
        <CarrierEditorCard mode="create" />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Edit carriers ({carriers.length})
        </h3>
        {carriers.map((carrier) => (
          <CarrierEditorCard
            key={carrier.id}
            mode="edit"
            carrier={{
              id: carrier.id,
              name: carrier.name,
              am_best_rating: carrier.am_best_rating,
              lines_of_business: carrier.lines,
              writes_uiia: Boolean(carrier.writes_uiia),
              is_preferred: Boolean(carrier.is_preferred),
            }}
          />
        ))}
        {carriers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-white px-4 py-8 text-center text-sm text-slate-500">
            No carriers match your filters.
            {allCarriers.length === 0
              ? " Use “Load default carriers” or add one above."
              : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
