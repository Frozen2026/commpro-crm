"use client";

import type { FormEvent } from "react";

import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createClient, updateClient } from "@/app/(app)/clients/actions";

type ClientFormValues = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

type ClientFormProps = {
  values?: ClientFormValues;
  createAction?: (formData: FormData) => Promise<void>;
};

export function ClientForm({ values, createAction }: ClientFormProps) {
  const action = values?.id ? updateClient : (createAction ?? createClient);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      event.preventDefault();
      console.error("[clients.form] Failed to fetch auth session before submit", {
        message: error.message,
        name: error.name,
        status: (error as { status?: number }).status,
      });
      return;
    }

    if (!session) {
      event.preventDefault();
      console.error("[clients.form] No auth session found on submit", {
        userId: null,
      });
      return;
    }

    console.log("[clients.form] Auth session present on submit:", Boolean(session), {
      userId: session?.user?.id ?? null,
      expiresAt: session?.expires_at ?? null,
    });
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">First Name</span>
          <input name="first_name" required defaultValue={values?.first_name ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Last Name</span>
          <input name="last_name" defaultValue={values?.last_name ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Business Name</span>
          <input name="business_name" defaultValue={values?.business_name ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input name="email" type="email" defaultValue={values?.email ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input name="phone" defaultValue={values?.phone ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Address</span>
          <input name="address" defaultValue={values?.address ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">City</span>
          <input name="city" defaultValue={values?.city ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">State</span>
          <input name="state" defaultValue={values?.state ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">ZIP</span>
          <input name="zip" defaultValue={values?.zip ?? ""} className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
        </label>
      </div>

      <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
        {values?.id ? "Update Client" : "Create Client"}
      </button>
    </form>
  );
}
