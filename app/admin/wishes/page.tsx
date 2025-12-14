import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Gift, Search } from "lucide-react"
import { WishesAdminClient } from "./wishes-admin-client"

export default async function AdminWishes() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  // Fetch all wishes with user and category info
  const { data: wishes } = await supabase
    .from("wishes")
    .select(`
      *,
      profiles!user_id (
        id,
        display_name,
        username,
        profile_public
      ),
      wish_categories (
        id,
        name,
        icon
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch all categories for the approve dropdown
  const { data: categories } = await supabase
    .from("wish_categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  // Fetch all profiles for fulfiller search
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, user_type, points")
    .order("display_name", { ascending: true })

  // Count by status
  const statusCounts = {
    pending: wishes?.filter(w => w.status === "pending").length || 0,
    approved: wishes?.filter(w => w.status === "approved").length || 0,
    fulfilled: wishes?.filter(w => w.status === "fulfilled").length || 0,
    rejected: wishes?.filter(w => w.status === "rejected").length || 0,
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Gift className="h-6 w-6" />
                Gerenciar Desejos
              </h1>
              <p className="text-sm text-white/60">
                {wishes?.length || 0} desejos cadastrados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Counts */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</p>
            <p className="text-sm text-yellow-400/70">Pendentes</p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-2xl font-bold text-green-400">{statusCounts.approved}</p>
            <p className="text-sm text-green-400/70">Aprovados</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-2xl font-bold text-blue-400">{statusCounts.fulfilled}</p>
            <p className="text-sm text-blue-400/70">Realizados</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-2xl font-bold text-red-400">{statusCounts.rejected}</p>
            <p className="text-sm text-red-400/70">Rejeitados</p>
          </div>
        </div>
      </div>

      <WishesAdminClient
        wishes={wishes || []}
        categories={categories || []}
        allProfiles={allProfiles || []}
      />
    </div>
  )
}
