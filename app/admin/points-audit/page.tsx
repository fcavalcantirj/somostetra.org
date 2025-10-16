import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, CheckCircle, TrendingUp, Award } from "lucide-react"
import { FixPointsButton } from "./fix-points-button"

export default async function PointsAuditPage() {
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

  // Get all profiles with their data
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, points, user_type, created_at, referred_by")
    .order("points", { ascending: false })

  // Get all referrals count per user (member-to-member and member-to-supporter via profiles)
  const { data: referrals } = await supabase
    .from("referrals")
    .select("referrer_id, referred_id")

  // Get all supporters (for counting supporter referrals from supporters table)
  const { data: supporters } = await supabase
    .from("supporters")
    .select("referred_by")

  // Get all user votes count per user
  const { data: userVotes } = await supabase
    .from("user_votes")
    .select("user_id")

  // Calculate expected points for each user
  const auditResults = (profiles || []).map((profile) => {
    let expectedPoints = 0
    const breakdown: string[] = []

    // 1. Initial signup points (10 points)
    expectedPoints += 10
    breakdown.push("Cadastro inicial: +10")

    // 2. Referrals - Count members referred
    const memberReferrals = referrals?.filter((r) => {
      const referred = profiles?.find((p) => p.id === r.referred_id)
      return r.referrer_id === profile.id && referred?.user_type === "member"
    }).length || 0

    // Count supporters referred (from referrals table - supporters with profiles)
    const supporterProfileReferrals = referrals?.filter((r) => {
      const referred = profiles?.find((p) => p.id === r.referred_id)
      return r.referrer_id === profile.id && referred?.user_type === "supporter"
    }).length || 0

    // Count supporters referred (from supporters table - supporters without profiles or before conversion)
    const directSupporterReferrals = supporters?.filter((s) => s.referred_by === profile.id).length || 0

    // Total supporters referred (avoid double counting)
    const totalSupporterReferrals = supporterProfileReferrals + directSupporterReferrals

    if (memberReferrals > 0) {
      expectedPoints += memberReferrals * 20
      breakdown.push(`${memberReferrals} membro(s) indicado(s): +${memberReferrals * 20}`)
    }

    if (totalSupporterReferrals > 0) {
      expectedPoints += totalSupporterReferrals * 10
      breakdown.push(`${totalSupporterReferrals} apoiador(es) indicado(s): +${totalSupporterReferrals * 10}`)
    }

    // 3. Votes cast
    const votesCount = userVotes?.filter((v) => v.user_id === profile.id).length || 0
    if (votesCount > 0) {
      expectedPoints += votesCount * 5
      breakdown.push(`${votesCount} voto(s): +${votesCount * 5}`)
    }

    const difference = profile.points - expectedPoints
    const isCorrect = difference === 0

    return {
      id: profile.id,
      display_name: profile.display_name,
      user_type: profile.user_type,
      current_points: profile.points,
      expected_points: expectedPoints,
      difference,
      isCorrect,
      breakdown,
      created_at: profile.created_at,
    }
  })

  const incorrectCount = auditResults.filter((r) => !r.isCorrect).length
  const totalUsers = auditResults.length
  const incorrectUsers = auditResults.filter((r) => !r.isCorrect)

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
              <h1 className="text-2xl font-bold">Auditoria de Pontos</h1>
              <p className="text-sm text-white/60">
                {incorrectCount === 0
                  ? "Todos os pontos estão corretos"
                  : `${incorrectCount} de ${totalUsers} usuários com pontos incorretos`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-8 w-8 text-blue-400" />
              <div className="text-2xl font-bold">{totalUsers}</div>
            </div>
            <div className="text-sm text-white/60">Total de Usuários</div>
          </div>

          <div
            className={`rounded-2xl border p-6 ${
              incorrectCount === 0
                ? "border-green-500/20 bg-green-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {incorrectCount === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-400" />
              )}
              <div className={`text-2xl font-bold ${incorrectCount === 0 ? "text-green-400" : "text-red-400"}`}>
                {incorrectCount}
              </div>
            </div>
            <div className="text-sm text-white/60">Pontos Incorretos</div>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div className="text-2xl font-bold text-green-400">{totalUsers - incorrectCount}</div>
            </div>
            <div className="text-sm text-white/60">Pontos Corretos</div>
          </div>
        </div>

        {/* Incorrect Points Section */}
        {incorrectCount > 0 && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                Usuários com Pontos Incorretos
              </h2>
              <FixPointsButton
                userId=""
                displayName=""
                currentPoints={0}
                correctPoints={0}
                variant="bulk"
                incorrectUsers={incorrectUsers}
              />
            </div>
            <div className="space-y-3">
              {auditResults
                .filter((r) => !r.isCorrect)
                .map((result) => (
                  <div key={result.id} className="rounded-lg border border-red-500/20 bg-black/40 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{result.display_name}</div>
                        <div className="text-sm text-white/60">
                          {result.user_type === "member" ? "Membro" : "Apoiador"} • Cadastrado em{" "}
                          {new Date(result.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-400">{result.difference > 0 ? "+" : ""}{result.difference}</div>
                          <div className="text-xs text-white/60">diferença</div>
                        </div>
                        <FixPointsButton
                          userId={result.id}
                          displayName={result.display_name}
                          currentPoints={result.current_points}
                          correctPoints={result.expected_points}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="rounded-lg bg-white/5 p-3">
                        <div className="text-sm text-white/60">Pontos Atuais</div>
                        <div className="text-xl font-bold">{result.current_points}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3">
                        <div className="text-sm text-white/60">Pontos Esperados</div>
                        <div className="text-xl font-bold text-green-400">{result.expected_points}</div>
                      </div>
                      <div className="rounded-lg bg-red-500/10 p-3">
                        <div className="text-sm text-white/60">Diferença</div>
                        <div className={`text-xl font-bold ${result.difference > 0 ? "text-red-400" : "text-yellow-400"}`}>
                          {result.difference > 0 ? "+" : ""}{result.difference}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-black/40 p-3">
                      <div className="text-sm font-medium text-white/80 mb-2">Cálculo Detalhado:</div>
                      <div className="space-y-1">
                        {result.breakdown.map((item, idx) => (
                          <div key={idx} className="text-sm text-white/60 font-mono">
                            • {item}
                          </div>
                        ))}
                        <div className="text-sm font-bold text-green-400 font-mono border-t border-white/10 pt-2 mt-2">
                          = Total Esperado: {result.expected_points} pontos
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* All Users Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold mb-4">Todos os Usuários</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Usuário</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Pontos Atuais</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Pontos Esperados</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Diferença</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditResults.map((result) => (
                  <tr key={result.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{result.display_name}</td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {result.user_type === "member" ? "Membro" : "Apoiador"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{result.current_points}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{result.expected_points}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${
                      result.difference === 0 ? "text-green-400" :
                      result.difference > 0 ? "text-red-400" : "text-yellow-400"
                    }`}>
                      {result.difference > 0 ? "+" : ""}{result.difference}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {result.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-400 mx-auto" />
                      )}
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
