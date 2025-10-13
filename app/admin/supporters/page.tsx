import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArrowLeft, Users, Mail, Calendar } from "lucide-react"
import Link from "next/link"
import { ConvertSupporterButton } from "./convert-supporter-button"
import { DeleteSupporterButton } from "./delete-supporter-button"

export default async function AdminSupporters() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  // Fetch all supporters with referrer info
  const { data: supporters } = await supabase
    .from("supporters")
    .select(
      `
      *,
      referrer:referred_by (
        display_name
      )
    `,
    )
    .order("created_at", { ascending: false })

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
              <h1 className="text-2xl font-bold">Gerenciar Apoiadores</h1>
              <p className="text-sm text-white/60">{supporters?.length || 0} apoiadores cadastrados</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar apoiadores..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Indicado por</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Data</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {supporters?.map((supporter) => (
                <tr key={supporter.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                        <Users className="h-5 w-5 text-purple-400" />
                      </div>
                      <span className="font-medium">{supporter.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Mail className="h-4 w-4" />
                      {supporter.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white/80">{supporter.referrer?.display_name || "Direto"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="h-4 w-4" />
                      {new Date(supporter.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ConvertSupporterButton
                        supporterId={supporter.id}
                        supporterName={supporter.name}
                        hasAuthUser={!!supporter.auth_user_id}
                      />
                      <DeleteSupporterButton supporterId={supporter.id} supporterName={supporter.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!supporters || supporters.length === 0) && (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-white/20" />
              <p className="text-white/60">Nenhum apoiador cadastrado ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
