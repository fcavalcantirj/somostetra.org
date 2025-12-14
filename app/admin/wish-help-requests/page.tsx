import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Heart, Mail, Phone, Calendar, User, Gift, MessageSquare } from "lucide-react"
import { WishHelpRequestsClient } from "./wish-help-requests-client"

export default async function AdminWishHelpRequests() {
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

  // Fetch all help requests with wish and member info
  const { data: requests } = await supabase
    .from("wish_help_requests")
    .select(`
      *,
      wishes (
        id,
        content,
        status,
        profiles!user_id (
          id,
          display_name,
          username
        )
      )
    `)
    .order("created_at", { ascending: false })

  // Count by status
  const statusCounts = {
    pending: requests?.filter(r => r.status === "pending").length || 0,
    contacted: requests?.filter(r => r.status === "contacted").length || 0,
    completed: requests?.filter(r => r.status === "completed").length || 0,
    declined: requests?.filter(r => r.status === "declined").length || 0,
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
                <Heart className="h-6 w-6 text-pink-400" />
                Ofertas de Ajuda
              </h1>
              <p className="text-sm text-white/60">
                {requests?.length || 0} ofertas recebidas
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
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-2xl font-bold text-blue-400">{statusCounts.contacted}</p>
            <p className="text-sm text-blue-400/70">Contatados</p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-2xl font-bold text-green-400">{statusCounts.completed}</p>
            <p className="text-sm text-green-400/70">Concluídos</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-2xl font-bold text-red-400">{statusCounts.declined}</p>
            <p className="text-sm text-red-400/70">Recusados</p>
          </div>
        </div>
      </div>

      <WishHelpRequestsClient requests={requests || []} />
    </div>
  )
}
