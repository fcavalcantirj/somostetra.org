import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Share2, TrendingUp, Sparkles, Plus, Heart } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { CopyButton } from "@/components/copy-button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch referral count
  const { count: referralCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id)

  // Fetch user votes count
  const { count: votesCount } = await supabase
    .from("user_votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch active votes
  const { data: activeVotes } = await supabase
    .from("votes")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(2)

  // Fetch user badges
  const { data: userBadges } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id).limit(3)

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id, display_name, points")
    .order("points", { ascending: false })
    .limit(10)

  const { count: supporterCount } = await supabase
    .from("supporters")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", user.id)

  const userRank = leaderboard?.findIndex((p) => p.id === user.id) ?? -1
  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://soutetra.com"}/auth/signup?ref=${profile?.referral_code}`
  const supporterLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://soutetra.com"}/auth/supporter-signup?ref=${profile?.referral_code}`
  const isAdmin = profile?.is_admin === true

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              Olá, <span className="text-gradient">{profile?.display_name || "Membro"}</span>
            </h1>
            <p className="text-xl text-muted-foreground">Bem-vinda de volta à sua comunidade</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Link
              href="/referrals"
              className="glass-strong p-8 rounded-3xl space-y-4 hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Convidados</span>
                {referralCount && referralCount > 0 && (
                  <Badge className="gradient-accent font-bold">+{referralCount}</Badge>
                )}
              </div>
              <p className="text-6xl font-black text-gradient">{referralCount || 0}</p>
              <p className="text-muted-foreground">Pessoas que você trouxe</p>
            </Link>

            <div className="glass-strong p-8 rounded-3xl space-y-4 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pontos</span>
                {userRank >= 0 && userRank < 10 && (
                  <Badge className="gradient-primary font-bold">Top {((userRank + 1) / 10) * 100}%</Badge>
                )}
              </div>
              <p className="text-6xl font-black text-gradient">{profile?.points || 0}</p>
              <p className="text-muted-foreground">Total acumulado</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Votações</span>
                <Badge className="gradient-accent font-bold">{activeVotes?.length || 0} ativas</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{votesCount || 0}</p>
              <p className="text-muted-foreground">Participações totais</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Member Referral */}
              <div className="space-y-6">
                <h2 className="text-4xl font-black">Seus Links de Convite</h2>

                {/* Member Referral */}
                <div className="glass-strong p-10 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Convide Membros</h3>
                      <p className="text-sm text-muted-foreground">Pessoas tetraplégicas para a comunidade</p>
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Compartilhe este link e ganhe <span className="text-accent font-bold">20 pontos</span> por cada
                    membro que se cadastrar
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all">{referralLink}</div>
                    <CopyButton text={referralLink} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Junte-se à comunidade SomosTetra! ${referralLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                      <a
                        href={`mailto:?subject=Junte-se à SomosTetra&body=${encodeURIComponent(`Olá! Convido você a fazer parte da comunidade SomosTetra: ${referralLink}`)}`}
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        Email
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Supporter Referral */}
                <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Convide Apoiadores</h3>
                      <p className="text-sm text-muted-foreground">Pessoas engajadas que querem ajudar</p>
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Compartilhe este link e ganhe <span className="text-accent font-bold">10 pontos</span> por cada
                    apoiador que se cadastrar. Apoiadores nos ajudam com números para pressionar autoridades!
                  </p>

                  {supporterCount && supporterCount > 0 && (
                    <div className="glass px-6 py-4 rounded-2xl">
                      <p className="text-center">
                        <span className="text-3xl font-black text-gradient">{supporterCount}</span>
                        <span className="text-muted-foreground ml-2">apoiadores convidados</span>
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all">
                      {supporterLink}
                    </div>
                    <CopyButton text={supporterLink} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Ajude a comunidade SomosTetra! Torne-se um apoiador: ${supporterLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                      <a
                        href={`mailto:?subject=Apoie a SomosTetra&body=${encodeURIComponent(`Olá! Convido você a apoiar a comunidade SomosTetra e ajudar a fazer a diferença: ${supporterLink}`)}`}
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        Email
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <h2 className="text-4xl font-black">Votações Ativas</h2>
                  <div className="flex gap-3">
                    {isAdmin && (
                      <Button className="gradient-primary font-bold" asChild>
                        <Link href="/votes/create">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="font-bold uppercase tracking-wider" asChild>
                      <Link href="/votes">Ver Todas →</Link>
                    </Button>
                  </div>
                </div>

                {activeVotes && activeVotes.length > 0 ? (
                  <div className="space-y-6">
                    {activeVotes.map((vote) => (
                      <div
                        key={vote.id}
                        className="glass-strong p-8 rounded-3xl space-y-6 hover:scale-[1.01] transition-transform"
                      >
                        <div className="space-y-4">
                          <Badge className="gradient-accent font-bold">Ativa</Badge>
                          <h3 className="text-2xl lg:text-3xl font-black leading-tight">{vote.title}</h3>
                          <p className="text-lg text-muted-foreground leading-relaxed">{vote.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <p className="text-sm text-muted-foreground font-bold">
                            <Users className="w-4 h-4 inline mr-1" />
                            {vote.vote_count} votos
                          </p>
                          <Button size="lg" className="gradient-primary font-bold h-12 px-8" asChild>
                            <Link href={`/votes/${vote.id}`}>Votar Agora</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-strong p-12 rounded-3xl text-center">
                    <p className="text-lg text-muted-foreground">Nenhuma votação ativa no momento</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-black">Suas Conquistas</h3>
                <div className="glass-strong p-8 rounded-3xl">
                  {userBadges && userBadges.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                      {userBadges.map((ub) => (
                        <div key={ub.id} className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl">
                            {ub.badges?.icon}
                          </div>
                          <span className="text-xs text-center font-bold">{ub.badges?.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Nenhuma conquista ainda</p>
                  )}
                </div>
                <Button variant="outline" className="w-full glass-strong font-bold h-12 bg-transparent" asChild>
                  <Link href="/badges">Ver Todas as Badges</Link>
                </Button>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-black">Ranking</h3>
                <div className="glass-strong p-6 rounded-3xl space-y-4">
                  {leaderboard && leaderboard.length > 0 ? (
                    <>
                      {leaderboard.slice(0, 3).map((member, index) => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl ${
                            index === 0 ? "gradient-primary" : "glass"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl ${index === 0 ? "bg-background/20" : "bg-muted-foreground/20"} flex items-center justify-center font-black text-lg`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{member.display_name}</p>
                            <p className={`text-sm ${index === 0 ? "opacity-80" : "text-muted-foreground"}`}>
                              {member.points} pts
                            </p>
                          </div>
                          {index === 0 && <Trophy className="w-5 h-5" />}
                        </div>
                      ))}

                      {userRank >= 3 && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl gradient-accent">
                          <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center font-black text-lg">
                            {userRank + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">Você</p>
                            <p className="text-sm opacity-80">{profile?.points} pts</p>
                          </div>
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground">Nenhum dado disponível</p>
                  )}
                </div>
                <Button variant="outline" className="w-full glass-strong font-bold h-12 bg-transparent" asChild>
                  <Link href="/leaderboard">Ver Ranking Completo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
