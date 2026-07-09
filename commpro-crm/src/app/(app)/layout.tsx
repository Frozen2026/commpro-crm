import { redirect } from "next/navigation";

import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <SidebarNav />
      <section className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">CommPro.ai</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </section>
    </div>
  );
}
