import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Database, Shield } from "lucide-react"

export default async function AdminDiagnostics() {
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

  const [
    { data: allSupporters },
    { data: allProfiles },
    { count: profilesCount },
    { count: supportersCount },
    { count: votesCount },
    { count: userVotesCount },
    { count: badgesCount },
    { count: userBadgesCount },
    { count: referralsCount },
    { count: activitiesCount },
  ] = await Promise.all([
    supabase.from("supporters").select("id, name, email, auth_user_id, created_at, referred_by"),
    supabase.from("profiles").select("id, display_name, referral_code, referred_by, created_at"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("supporters").select("*", { count: "exact", head: true }),
    supabase.from("votes").select("*", { count: "exact", head: true }),
    supabase.from("user_votes").select("*", { count: "exact", head: true }),
    supabase.from("badges").select("*", { count: "exact", head: true }),
    supabase.from("user_badges").select("*", { count: "exact", head: true }),
    supabase.from("referrals").select("*", { count: "exact", head: true }),
    supabase.from("activities").select("*", { count: "exact", head: true }),
  ])

  // Analyze data to find issues
  const supportersWithoutProfiles = (allSupporters || []).filter(
    (supporter) => supporter.auth_user_id && !allProfiles?.find((p) => p.id === supporter.auth_user_id),
  )

  const supportersWithoutAuthId = (allSupporters || []).filter((supporter) => !supporter.auth_user_id)

  // Find duplicate referral codes
  const referralCodeCounts = new Map<string, number>()
  allProfiles?.forEach((profile) => {
    if (profile.referral_code) {
      referralCodeCounts.set(profile.referral_code, (referralCodeCounts.get(profile.referral_code) || 0) + 1)
    }
  })
  const duplicateReferralCodes = Array.from(referralCodeCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([code, count]) => ({ code, count }))

  // Find orphaned referrals (profiles with referred_by that doesn't exist)
  const orphanedReferrals = (allProfiles || []).filter(
    (profile) => profile.referred_by && !allProfiles?.find((p) => p.id === profile.referred_by),
  )

  const tableCounts = {
    profiles: profilesCount || 0,
    supporters: supportersCount || 0,
    votes: votesCount || 0,
    user_votes: userVotesCount || 0,
    badges: badgesCount || 0,
    user_badges: userBadgesCount || 0,
    referrals: referralsCount || 0,
    activities: activitiesCount || 0,
  }

  const issues = [
    {
      title: "Apoiadores sem Perfil",
      description: "Apoiadores que não podem votar porque não têm perfil",
      count: supportersWithoutProfiles.length,
      severity: "high" as const,
      data: supportersWithoutProfiles.slice(0, 10),
    },
    {
      title: "Apoiadores sem Auth",
      description: "Apoiadores sem conta de autenticação (cadastros antigos)",
      count: supportersWithoutAuthId.length,
      severity: "low" as const,
      data: supportersWithoutAuthId.slice(0, 10),
    },
    {
      title: "Códigos de Indicação Duplicados",
      description: "Códigos de indicação que aparecem mais de uma vez",
      count: duplicateReferralCodes.length,
      severity: "high" as const,
      data: duplicateReferralCodes,
    },
    {
      title: "Indicações Órfãs",
      description: "Perfis com indicador inexistente",
      count: orphanedReferrals.length,
      severity: "medium" as const,
      data: orphanedReferrals.slice(0, 10),
    },
  ]

  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0)

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
              <h1 className="text-2xl font-bold">Diagnóstico do Banco de Dados</h1>
              <p className="text-sm text-white/60">
                {totalIssues === 0 ? "Nenhum problema detectado" : `${totalIssues} problema(s) detectado(s)`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Health Status */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className={`rounded-full p-3 ${totalIssues === 0 ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
              {totalIssues === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{totalIssues === 0 ? "Sistema Saudável" : "Problemas Detectados"}</h2>
              <p className="text-sm text-white/60">
                {totalIssues === 0
                  ? "Todas as verificações passaram com sucesso"
                  : "Alguns problemas foram encontrados e precisam de atenção"}
              </p>
            </div>
          </div>

          {/* Table Counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.profiles}</div>
              <div className="text-sm text-white/60">Perfis</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.supporters}</div>
              <div className="text-sm text-white/60">Apoiadores</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.votes}</div>
              <div className="text-sm text-white/60">Votações</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.user_votes}</div>
              <div className="text-sm text-white/60">Votos</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.badges}</div>
              <div className="text-sm text-white/60">Badges</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.user_badges}</div>
              <div className="text-sm text-white/60">Badges Ganhas</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.referrals}</div>
              <div className="text-sm text-white/60">Indicações</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold">{tableCounts.activities}</div>
              <div className="text-sm text-white/60">Atividades</div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Problemas Detectados
          </h2>

          {issues.map((issue, index) => (
            <div
              key={index}
              className={`rounded-2xl border p-6 backdrop-blur-sm ${
                issue.count === 0
                  ? "border-green-500/20 bg-green-500/5"
                  : issue.severity === "high"
                    ? "border-red-500/20 bg-red-500/5"
                    : issue.severity === "medium"
                      ? "border-yellow-500/20 bg-yellow-500/5"
                      : "border-blue-500/20 bg-blue-500/5"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {issue.count === 0 ? (
                    <CheckCircle className="h-6 w-6 text-green-400 mt-1" />
                  ) : issue.severity === "high" ? (
                    <XCircle className="h-6 w-6 text-red-400 mt-1" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-yellow-400 mt-1" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{issue.title}</h3>
                    <p className="text-sm text-white/60">{issue.description}</p>
                  </div>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    issue.count === 0
                      ? "bg-green-500/20 text-green-400"
                      : issue.severity === "high"
                        ? "bg-red-500/20 text-red-400"
                        : issue.severity === "medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {issue.count}
                </div>
              </div>

              {issue.count > 0 && issue.data && issue.data.length > 0 && (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-medium mb-2">Detalhes:</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {issue.data.map((item: any, idx: number) => (
                      <div key={idx} className="text-sm text-white/80 font-mono bg-black/40 p-2 rounded">
                        {JSON.stringify(item, null, 2)}
                      </div>
                    ))}
                    {issue.count > issue.data.length && (
                      <div className="text-sm text-white/40 italic">
                        ... e mais {issue.count - issue.data.length} registro(s)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {totalIssues > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Ações Recomendadas
            </h2>
            <div className="space-y-3">
              {supportersWithoutProfiles.length > 0 && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <h3 className="font-semibold mb-1">Corrigir Perfis Ausentes</h3>
                  <p className="text-sm text-white/60 mb-3">
                    Execute o script 032 ou 034 para criar perfis para apoiadores
                  </p>
                  <code className="text-xs bg-black/40 p-2 rounded block">
                    scripts/032_fix_missing_supporter_profiles.sql
                  </code>
                </div>
              )}
              {duplicateReferralCodes.length > 0 && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <h3 className="font-semibold mb-1">Códigos Duplicados</h3>
                  <p className="text-sm text-white/60">
                    Códigos de indicação duplicados precisam ser corrigidos manualmente
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
