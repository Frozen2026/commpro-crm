import { redirect } from "next/navigation";

import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const AUTH_TIMEOUT_MS = 4000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const result = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);
  const user = result?.data.user ?? null;

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <SidebarNav />
      <section className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <div>
            <h1 className="font-[family-name:var(--font-barlow-condensed)] text-lg font-extrabold uppercase tracking-wide text-[var(--steel)]">
              CommPro.ai
            </h1>
            <p className="text-sm text-[var(--muted)]">{user.email}</p>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 bg-[var(--background)] p-6">{children}</main>
      </section>
    </div>
  );
}
