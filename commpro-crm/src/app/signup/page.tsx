"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setMessage("Account created. Check your email for a confirmation link.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(232,147,26,0.12),_transparent_40%),linear-gradient(180deg,var(--steel-pale)_0%,var(--background)_55%)] p-6">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <p className="mb-2 font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          Commercial Pro
        </p>
        <h1 className="mb-1 font-[family-name:var(--font-barlow-condensed)] text-3xl font-black uppercase tracking-tight text-[var(--steel)]">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">
          Start managing leads, policies, and renewals in CommPro.ai.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2"
              placeholder="Minimum 6 characters"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--accent)] px-4 py-2.5 font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--steel-dark)] transition hover:bg-[var(--accent-dark)] disabled:opacity-75"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-600">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
