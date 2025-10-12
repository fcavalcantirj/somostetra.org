import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Share2, Award, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CopyButton } from "@/components/copy-button"

export default async function ReferralsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch referrals with referred user details
  const { data: memberReferrals } = await supabase
    .from("referrals")
    .select(
      `
      id,
      created_at,
      referred:referred_id (
        id,
        display_name,
        points,
        created_at
      )
    `,
    )
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch supporter referrals
  const { data: supporterReferrals } = await supabase
    .from("supporters")
    .select("id, name, email, created_at")
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false })

  const memberReferralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/signup?ref=${profile?.referral_code}`
  const supporterReferralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup?ref=${profile?.referral_code}`

  const totalMemberReferrals = memberReferrals?.length || 0
  const totalSupporterReferrals = supporterReferrals?.length || 0
  const totalPointsEarned = totalMemberReferrals * 20 + totalSupporterReferrals * 10

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOU<span className="text-gradient">TETRA</span>
          </Link>
          <Button asChild variant="outline" className="glass-strong font-bold bg-transparent">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              Suas <span className="text-gradient">Indicações</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Compartilhe o SouTetra e ganhe pontos por cada pessoa que se juntar
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Membros Indicados
                </span>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-6xl font-black text-gradient">{totalMemberReferrals}</p>
              <p className="text-muted-foreground">Tetraplégicos que você trouxe</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Apoiadores</span>
                <Users className="w-5 h-5 text-accent" />
              </div>
              <p className="text-6xl font-black text-gradient">{totalSupporterReferrals}</p>
              <p className="text-muted-foreground">Pessoas engajadas</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pontos Ganhos</span>
                <Award className="w-5 h-5 text-accent" />
              </div>
              <p className="text-6xl font-black text-gradient">{totalPointsEarned}</p>
              <p className="text-muted-foreground">Por todas indicações</p>
            </div>
          </div>

          <div className="space-y-8 mb-16">
            <h2 className="text-4xl font-black">Seus Links de Convite</h2>

            {/* Member Referral Link */}
            <div className="glass-strong p-10 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-blue-500/20 p-2">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold">Para Tetraplégicos</h3>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Compartilhe este link com outros tetraplégicos e ganhe{" "}
                <span className="text-accent font-bold">20 pontos</span> por cada cadastro
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all">
                  {memberReferralLink}
                </div>
                <CopyButton text={memberReferralLink} linkType="member" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Junte-se à comunidade SomosTetra! ${memberReferralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`mailto:?subject=Junte-se à SomosTetra&body=${encodeURIComponent(`Olá! Convido você a fazer parte da comunidade SomosTetra: ${memberReferralLink}`)}`}
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </div>

            {/* Supporter Referral Link */}
            <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-purple-500/20 p-2">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold">Para Apoiadores</h3>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Compartilhe com pessoas que querem apoiar a causa e ganhe{" "}
                <span className="text-purple-400 font-bold">10 pontos</span> por cada apoiador
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all">
                  {supporterReferralLink}
                </div>
                <CopyButton text={supporterReferralLink} linkType="supporter" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Apoie a causa SomosTetra! ${supporterReferralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`mailto:?subject=Apoie a SomosTetra&body=${encodeURIComponent(`Olá! Convido você a apoiar a causa SomosTetra: ${supporterReferralLink}`)}`}
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-black">Suas Indicações</h2>

            {/* Member Referrals */}
            {memberReferrals && memberReferrals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  Membros Tetraplégicos ({totalMemberReferrals})
                </h3>
                {memberReferrals.map((referral: any) => (
                  <div key={referral.id} className="glass-strong p-6 rounded-3xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{referral.referred?.display_name || "Membro"}</p>
                          <p className="text-sm text-muted-foreground">
                            Entrou em {new Date(referral.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="gradient-accent font-bold">+20 pts</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {referral.referred?.points || 0} pts totais
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Supporter Referrals */}
            {supporterReferrals && supporterReferrals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-400" />
                  Apoiadores ({totalSupporterReferrals})
                </h3>
                {supporterReferrals.map((supporter) => (
                  <div key={supporter.id} className="glass-strong p-6 rounded-3xl border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{supporter.name}</p>
                          <p className="text-sm text-muted-foreground">{supporter.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Apoiou em {new Date(supporter.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400 font-bold">+10 pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!memberReferrals || memberReferrals.length === 0) &&
              (!supporterReferrals || supporterReferrals.length === 0) && (
                <div className="glass-strong p-12 rounded-3xl text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl gradient-primary/20 flex items-center justify-center mx-auto">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black">Nenhuma indicação ainda</h3>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Compartilhe seus links de convite e seja o primeiro a trazer novos membros e apoiadores!
                  </p>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  )
}
