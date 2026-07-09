function getEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
