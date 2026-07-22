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
    return value;
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

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("insurance_carriers")
    .select("id, name, am_best_rating, lines_of_business, writes_uiia, is_preferred")
    .order("name", { ascending: true });

  const carriers = ((data ?? []) as CarrierRow[]).filter((carrier) => {
    const lines = normalizeLines(carrier.lines_of_business);
    const matchesQuery =
      query.length === 0 || carrier.name.toLowerCase().includes(query.toLowerCase());
    const matchesLine =
      selectedLine.length === 0 ||
      lines.some((line) => line.toLowerCase() === selectedLine.toLowerCase());
    return matchesQuery && matchesLine;
  });

  const allLines = Array.from(
    new Set(
      ((data ?? []) as CarrierRow[])
        .flatMap((carrier) => normalizeLines(carrier.lines_of_business))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Carriers</h2>
        <p className="mt-1 text-sm text-slate-600">Carrier directory with appetite and preference indicators.</p>
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
          Apply Filters
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">AM Best</th>
              <th className="px-4 py-3 font-semibold">Lines of Business</th>
              <th className="px-4 py-3 font-semibold">UIIA</th>
              <th className="px-4 py-3 font-semibold">Preferred</th>
            </tr>
          </thead>
          <tbody>
            {carriers.map((carrier) => {
              const lines = normalizeLines(carrier.lines_of_business);
              return (
                <tr key={carrier.id} className="border-t border-[var(--border)] align-top">
                  <td className="px-4 py-3 text-slate-900">{carrier.name}</td>
                  <td className="px-4 py-3 text-slate-700">{carrier.am_best_rating ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {lines.length > 0 ? (
                        lines.map((line) => (
                          <span key={`${carrier.id}-${line}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                            {line}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {carrier.writes_uiia ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Writes UIIA</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">No UIIA</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xl leading-none text-amber-500">
                    {carrier.is_preferred ? "★" : "☆"}
                  </td>
                </tr>
              );
            })}
            {carriers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No carriers match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
