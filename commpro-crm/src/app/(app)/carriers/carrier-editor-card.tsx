"use client";

import { useFormStatus } from "react-dom";

import {
  createCarrier,
  deleteCarrier,
  STANDARD_LINES_OF_BUSINESS,
  updateCarrier,
} from "@/app/(app)/carriers/actions";

export type CarrierFormValues = {
  id?: string;
  name: string;
  am_best_rating: string | null;
  lines_of_business: string[];
  writes_uiia: boolean;
  is_preferred: boolean;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function LinesOfBusinessFields({ selected }: { selected: string[] }) {
  const selectedSet = new Set(selected.map((line) => line.toLowerCase()));
  const extraLines = selected.filter(
    (line) =>
      !STANDARD_LINES_OF_BUSINESS.some(
        (standard) => standard.toLowerCase() === line.toLowerCase(),
      ),
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">Lines of business</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STANDARD_LINES_OF_BUSINESS.map((line) => (
          <label key={line} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="lines_of_business"
              value={line}
              defaultChecked={selectedSet.has(line.toLowerCase())}
              className="rounded border-slate-300"
            />
            <span>{line}</span>
          </label>
        ))}
        {extraLines.map((line) => (
          <label key={line} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="lines_of_business"
              value={line}
              defaultChecked
              className="rounded border-slate-300"
            />
            <span>{line}</span>
          </label>
        ))}
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-slate-600">
          Extra lines (comma-separated)
        </span>
        <input
          name="custom_lines"
          defaultValue=""
          placeholder="e.g. Inland Marine, Excess"
          className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}

export function CarrierEditorCard({
  carrier,
  mode,
}: {
  carrier?: CarrierFormValues;
  mode: "create" | "edit";
}) {
  const action = mode === "create" ? createCarrier : updateCarrier;
  const values = carrier ?? {
    name: "",
    am_best_rating: "",
    lines_of_business: [],
    writes_uiia: false,
    is_preferred: false,
  };

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-4"
    >
      {mode === "edit" && values.id ? (
        <input type="hidden" name="id" value={values.id} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Carrier name *</span>
          <input
            name="name"
            required
            defaultValue={values.name}
            className="w-full rounded-md border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">AM Best rating</span>
          <input
            name="am_best_rating"
            defaultValue={values.am_best_rating ?? ""}
            placeholder="A+"
            className="w-full rounded-md border border-[var(--border)] px-3 py-2"
          />
        </label>
      </div>

      <LinesOfBusinessFields selected={values.lines_of_business} />

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="writes_uiia"
            defaultChecked={values.writes_uiia}
            className="rounded border-slate-300"
          />
          Writes UIIA
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_preferred"
            defaultChecked={values.is_preferred}
            className="rounded border-slate-300"
          />
          Preferred
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={mode === "create" ? "Add carrier" : "Save changes"} />
        {mode === "edit" && values.id ? (
          <button
            formAction={deleteCarrier}
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            onClick={(event) => {
              if (!window.confirm(`Delete ${values.name}?`)) {
                event.preventDefault();
              }
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
