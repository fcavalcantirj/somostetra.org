import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, Vote, Award, Database, TrendingUp, Star, FolderOpen, Heart, Microscope, Search } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  // Fetch dashboard stats
  const [
    { count: totalUsers },
    { count: totalSupporters },
    { count: activeVotes },
    { count: totalBadges },
    { count: pendingWishes },
    { count: pendingHelpRequests },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("supporters").select("*", { count: "exact", head: true }),
    supabase.from("votes").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("user_badges").select("*", { count: "exact", head: true }),
    supabase.from("wishes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("wish_help_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("profiles")
      .select("display_name, points, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const stats = [
    {
      title: "Membros (Tetraplégicos)",
      value: totalUsers || 0,
      icon: Users,
      href: "/admin/members",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Apoiadores",
      value: totalSupporters || 0,
      icon: Users,
      href: "/admin/supporters",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Votações Ativas",
      value: activeVotes || 0,
      icon: Vote,
      href: "/admin/votes",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Badges Conquistadas",
      value: totalBadges || 0,
      icon: Award,
      href: "/admin/badges",
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Desejos Pendentes",
      value: pendingWishes || 0,
      icon: Star,
      href: "/admin/wishes",
      color: "from-pink-500 to-rose-500",
    },
    {
      title: "Ofertas de Ajuda",
      value: pendingHelpRequests || 0,
      icon: Heart,
      href: "/admin/wish-help-requests",
      color: "from-rose-500 to-pink-500",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-white/60">Painel de administração SomosTetra</p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10"
            >
              Voltar ao Site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.title}
                href={stat.href}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity group-hover:opacity-10`}
                />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <Icon className="h-8 w-8 text-white/60" />
                    <div className={`rounded-full bg-gradient-to-br ${stat.color} p-2 opacity-20`} />
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/60">{stat.title}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-6 lg:grid-cols-4">
          <Link
            href="/admin/members"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Users className="mb-4 h-10 w-10 text-blue-400" />
            <h3 className="mb-2 text-lg font-semibold">Gerenciar Membros</h3>
            <p className="text-sm text-white/60">Visualize e modere membros tetraplégicos</p>
          </Link>

          <Link
            href="/admin/supporters"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Users className="mb-4 h-10 w-10 text-purple-400" />
            <h3 className="mb-2 text-lg font-semibold">Gerenciar Apoiadores</h3>
            <p className="text-sm text-white/60">Visualize pessoas engajadas na causa</p>
          </Link>

          <Link
            href="/admin/votes"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Vote className="mb-4 h-10 w-10 text-green-400" />
            <h3 className="mb-2 text-lg font-semibold">Moderar Votações</h3>
            <p className="text-sm text-white/60">Aprove, edite ou remova votações</p>
          </Link>

          <Link
            href="/admin/badges"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Award className="mb-4 h-10 w-10 text-yellow-400" />
            <h3 className="mb-2 text-lg font-semibold">Gerenciar Badges</h3>
            <p className="text-sm text-white/60">Crie e atribua badges aos membros</p>
          </Link>

          <Link
            href="/admin/diagnostics"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Database className="mb-4 h-10 w-10 text-red-400" />
            <h3 className="mb-2 text-lg font-semibold">Diagnóstico do Sistema</h3>
            <p className="text-sm text-white/60">Verifique a saúde do banco de dados</p>
          </Link>

          <Link
            href="/admin/fix-users"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-sm transition-all hover:border-red-500/50 hover:bg-red-500/20"
          >
            <Users className="mb-4 h-10 w-10 text-red-400" />
            <h3 className="mb-2 text-lg font-semibold">Corrigir Contas Quebradas</h3>
            <p className="text-sm text-white/60">Usuários sem perfis (trigger falhou)</p>
          </Link>

          <Link
            href="/admin/points-audit"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <TrendingUp className="mb-4 h-10 w-10 text-cyan-400" />
            <h3 className="mb-2 text-lg font-semibold">Auditoria de Pontos</h3>
            <p className="text-sm text-white/60">Verificar pontos reais vs. calculados</p>
          </Link>

          <Link
            href="/admin/wishes"
            className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-6 backdrop-blur-sm transition-all hover:border-pink-500/50 hover:bg-pink-500/20"
          >
            <Star className="mb-4 h-10 w-10 text-pink-400" />
            <h3 className="mb-2 text-lg font-semibold">Gerenciar Desejos</h3>
            <p className="text-sm text-white/60">Aprovar, rejeitar e realizar desejos</p>
          </Link>

          <Link
            href="/admin/wish-categories"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <FolderOpen className="mb-4 h-10 w-10 text-orange-400" />
            <h3 className="mb-2 text-lg font-semibold">Categorias de Desejos</h3>
            <p className="text-sm text-white/60">Gerenciar categorias para estatísticas</p>
          </Link>

          <Link
            href="/admin/wish-help-requests"
            className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-6 backdrop-blur-sm transition-all hover:border-pink-500/50 hover:bg-pink-500/20"
          >
            <Heart className="mb-4 h-10 w-10 text-pink-400" />
            <h3 className="mb-2 text-lg font-semibold">Ofertas de Ajuda</h3>
            <p className="text-sm text-white/60">Pessoas querendo ajudar nos desejos</p>
          </Link>

          <Link
            href="/admin/clinical-trials"
            className="rounded-2xl border border-primary/30 bg-primary/10 p-6 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/20"
          >
            <Microscope className="mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Estudos Clínicos</h3>
            <p className="text-sm text-white/60">Buscar trials e notificar membros</p>
          </Link>

          <Link
            href="/admin/clinical-trial-searches"
            className="rounded-2xl border border-primary/30 bg-primary/10 p-6 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/20"
          >
            <Search className="mb-4 h-10 w-10 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Buscas de Estudos</h3>
            <p className="text-sm text-white/60">Análise de queries dos usuários</p>
          </Link>
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Usuários Recentes</h3>
          <div className="space-y-3">
            {recentUsers?.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
              >
                <div>
                  <div className="font-medium">{user.display_name}</div>
                  <div className="text-sm text-white/60">{new Date(user.created_at).toLocaleDateString("pt-BR")}</div>
                </div>
                <div className="text-sm font-medium text-green-400">{user.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
