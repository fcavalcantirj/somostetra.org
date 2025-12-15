import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search, Users, MapPin, BarChart3 } from "lucide-react"
import { SearchAnalyticsClient } from "./search-analytics-client"

export default async function ClinicalTrialSearchesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  // Fetch search data with user info
  const { data: searches, error } = await supabase
    .from("clinical_trial_searches")
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(200)

  // Fetch stats
  const { count: totalSearches } = await supabase
    .from("clinical_trial_searches")
    .select("*", { count: "exact", head: true })

  // Get unique users count
  const { data: uniqueUsersData } = await supabase
    .from("clinical_trial_searches")
    .select("user_id")

  const uniqueUsers = new Set(uniqueUsersData?.map((s) => s.user_id)).size

  // Calculate Brazil filter usage
  const brazilOnlyCount = searches?.filter((s) => s.brazil_only).length || 0
  const brazilUsagePercent = searches?.length
    ? Math.round((brazilOnlyCount / searches.length) * 100)
    : 0

  // Calculate average results
  const avgResults = searches?.length
    ? Math.round(
        searches.reduce((sum, s) => sum + (s.results_count || 0), 0) /
          searches.length
      )
    : 0

  // Get top conditions
  const conditionCounts: Record<string, number> = {}
  searches?.forEach((search) => {
    search.query_conditions?.forEach((condition: string) => {
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1
    })
  })
  const topConditions = Object.entries(conditionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  const stats = {
    totalSearches: totalSearches || 0,
    uniqueUsers,
    brazilUsagePercent,
    avgResults,
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Search className="h-6 w-6 text-[#00D5BE]" />
                Buscas de Estudos Clínicos
              </h1>
              <p className="text-sm text-white/60">
                Analise as buscas realizadas pelos usuários
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#00D5BE]/20 p-2">
                <Search className="h-5 w-5 text-[#00D5BE]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSearches}</p>
                <p className="text-sm text-white/60">Total de Buscas</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                <p className="text-sm text-white/60">Usuários Únicos</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <MapPin className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.brazilUsagePercent}%</p>
                <p className="text-sm text-white/60">Filtro Brasil</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgResults}</p>
                <p className="text-sm text-white/60">Média de Resultados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Conditions */}
        {topConditions.length > 0 && (
          <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold">Condições Mais Buscadas</h2>
            <div className="flex flex-wrap gap-2">
              {topConditions.map(([condition, count]) => (
                <span
                  key={condition}
                  className="inline-flex items-center gap-2 rounded-full bg-[#00D5BE]/10 border border-[#00D5BE]/30 px-3 py-1 text-sm"
                >
                  <span className="text-[#00D5BE]">{condition}</span>
                  <span className="text-white/60">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Searches Table */}
        <SearchAnalyticsClient searches={searches || []} />
      </div>
    </div>
  )
}
