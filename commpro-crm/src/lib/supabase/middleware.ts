import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const AUTH_TIMEOUT_MS = 2000;

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

/**
 * Optional session refresh helper. Do not call from Edge middleware unless
 * wrapped with a short timeout — unreachable Supabase URLs will otherwise
 * trigger Vercel MIDDLEWARE_INVOCATION_TIMEOUT (504).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // Fail closed/fast if env points at a non-routable local URL on Vercel.
  if (!supabaseUrl || supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);

  return response;
}
