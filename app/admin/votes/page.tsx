import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search, Plus } from "lucide-react"
import { VoteActions } from "@/components/admin/vote-actions"

export default async function AdminVotes() {
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

  // Fetch all votes with creator info
  const { data: votes } = await supabase
    .from("votes")
    .select(`
      *,
      creator:profiles!created_by(display_name)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Moderar Votações</h1>
                <p className="text-sm text-white/60">{votes?.length || 0} votações criadas</p>
              </div>
            </div>
            <Link
              href="/votes/create"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 font-medium transition-all hover:from-green-500 hover:to-emerald-500"
            >
              <Plus className="h-5 w-5" />
              Criar Votação
            </Link>
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
              placeholder="Buscar votações..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 backdrop-blur-sm transition-colors focus:border-white/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Votes Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          {!votes || votes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-white/5 p-4">
                <Search className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Nenhuma votação criada ainda</h3>
              <p className="mb-6 text-sm text-white/60">Crie a primeira votação para começar a engajar a comunidade</p>
              <Link
                href="/votes/create"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-medium transition-all hover:from-green-500 hover:to-emerald-500"
              >
                <Plus className="h-5 w-5" />
                Criar Primeira Votação
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Título</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Categoria</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Criador</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Votos</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Data</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white/60">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {votes?.map((vote) => (
                    <tr key={vote.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-medium">{vote.title}</div>
                          <div className="truncate text-sm text-white/60">{vote.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                          {vote.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/80">{vote.creator?.display_name}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
                          {vote.vote_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            vote.status === "active"
                              ? "bg-green-500/10 text-green-400"
                              : vote.status === "completed"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {vote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {new Date(vote.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <VoteActions voteId={vote.id} currentStatus={vote.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
