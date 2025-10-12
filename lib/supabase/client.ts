import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables in browser client")
    throw new Error("Missing Supabase environment variables")
  }

  console.log("[v0] Creating Supabase browser client")

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
