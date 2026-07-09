"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSignOut = async () => {
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={loading}
      className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
