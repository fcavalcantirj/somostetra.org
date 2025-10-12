import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { UserActions } from "@/components/admin/user-actions"

export default async function AdminUsers() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  const { data: users } = await supabase
    .from("profiles")
    .select(`
      *,
      referrals:referrals!referrer_id(count),
      user_badges(
        badge_id,
        earned_at,
        badges(id, name, icon, points_required)
      )
    `)
    .order("created_at", { ascending: false })

  const { data: allBadges } = await supabase.from("badges").select("*").order("points_required", { ascending: true })

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
              <p className="text-sm text-white/60">{users?.length || 0} usuários cadastrados</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 backdrop-blur-sm transition-colors focus:border-white/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Usuário</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Pontos</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Referências</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Badges</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Cadastro</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Admin</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-white/60">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users?.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-sm text-white/60">{user.referral_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
                        {user.points} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/80">{user.referrals?.[0]?.count || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.user_badges?.map((ub: any) => (
                          <span key={ub.badge_id} className="text-lg" title={ub.badges?.name}>
                            {ub.badges?.icon}
                          </span>
                        ))}
                        {(!user.user_badges || user.user_badges.length === 0) && (
                          <span className="text-sm text-white/40">Nenhuma</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin && (
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <UserActions
                        userId={user.id}
                        isAdmin={user.is_admin}
                        userBadges={user.user_badges || []}
                        allBadges={allBadges || []}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
