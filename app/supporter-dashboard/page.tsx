import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, TrendingUp, Share2, Sparkles, Trophy, Award } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { CopyButton } from "@/components/copy-button"
import { trackDashboardView } from "@/lib/analytics"

export default async function SupporterDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch supporter profile
  const { data: supporter } = await supabase.from("supporters").select("*").eq("auth_user_id", user.id).single()

  if (!supporter) {
    // Not a supporter, redirect to regular dashboard
    redirect("/dashboard")
  }

  // Fetch supporter's profile - must exist since supporter record exists
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch referrer info if exists
  let referrerInfo = null
  if (supporter.referred_by) {
    const { data: referrer } = await supabase
      .from("profiles")
      .select("display_name, referral_code")
      .eq("id", supporter.referred_by)
      .single()
    referrerInfo = referrer
  }

  const { data: activeVotes } = await supabase
    .from("votes")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const { count: votesCount } = await supabase
    .from("user_votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch total members count
  const { count: membersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  // Fetch total supporters count
  const { count: supportersCount } = await supabase.from("supporters").select("*", { count: "exact", head: true })

  // Fetch supporter's own referrals (supporters they invited)
  const { data: myReferrals } = await supabase
    .from("supporters")
    .select("id, name, created_at")
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false })

  // FIXED: Use supporter's OWN referral code, not their referrer's code!
  const supporterLink = profile?.referral_code
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup?ref=${profile.referral_code}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup`

  const myReferralsCount = myReferrals?.length || 0
  const pointsFromReferrals = myReferralsCount * 10

  return (
    <div className="min-h-screen relative overflow-hidden">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              ${trackDashboardView.toString()}
              trackDashboardView('supporter');
            }
          `,
        }}
      />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between max-w-full">
          <Link href="/supporter-dashboard" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Heart className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">Apoiador</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              Olá, <span className="text-gradient">{supporter.name}</span>
            </h1>
            <p className="text-xl text-muted-foreground">Obrigado por apoiar a comunidade SomosTetra!</p>
          </div>

          {/* Impact Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Membros</span>
                <Badge className="gradient-primary font-bold">Tetraplégicos</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{membersCount || 0}</p>
              <p className="text-muted-foreground">Na comunidade</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Apoiadores</span>
                <Badge className="gradient-accent font-bold">Como você</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{supportersCount || 0}</p>
              <p className="text-muted-foreground">Engajados na causa</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Votações</span>
                <Badge className="gradient-accent font-bold">Ativas</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{activeVotes?.length || 0}</p>
              <p className="text-muted-foreground">
                {votesCount !== null && votesCount > 0 ? `Você votou ${votesCount}x` : "Participe agora"}
              </p>
            </div>
          </div>

          {/* Active Votes Section */}
          {activeVotes && activeVotes.length > 0 && (
            <div className="space-y-6 mb-16">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black">Votações Ativas</h2>
                <Button variant="ghost" className="font-bold uppercase tracking-wider" asChild>
                  <Link href="/votes">Ver Todas →</Link>
                </Button>
              </div>

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
            </div>
          )}

          {/* Referrer Info */}
          {referrerInfo && (
            <div className="glass-strong p-10 rounded-3xl mb-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Convidado por</h3>
                  <p className="text-2xl font-black text-gradient">{referrerInfo.display_name}</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                Você foi convidado por um membro da comunidade. Sua participação ajuda a fortalecer nossa voz!
              </p>
            </div>
          )}

          {/* Call to Action */}
          <div className="space-y-8">
            <h2 className="text-4xl font-black">Amplifique Nosso Impacto</h2>

            {/* How to Earn Points Section */}
            {profile && (
              <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Como Você Ganha Pontos</h3>
                    <p className="text-muted-foreground">Suas contribuições são reconhecidas!</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass p-6 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Votações</span>
                      <Badge className="gradient-accent font-bold">+5 pts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Cada voto em causas importantes</p>
                  </div>

                  <div className="glass p-6 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Indicações</span>
                      <Badge className="gradient-accent font-bold">+10 pts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Cada apoiador que você trouxer</p>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border-2 border-accent/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Seus Pontos</p>
                      <p className="text-4xl font-black text-gradient">{profile.points || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Suas Indicações</p>
                      <p className="text-4xl font-black text-gradient">{myReferralsCount}</p>
                    </div>
                  </div>
                  {myReferralsCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Você ganhou <span className="text-accent font-bold">{pointsFromReferrals} pontos</span> por suas indicações!
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Compartilhe SEU Link Único</h3>
                  <p className="text-muted-foreground">Ganhe +10 pontos por cada apoiador!</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Este é o <span className="text-accent font-bold">seu link pessoal</span>. Compartilhe com amigos e familiares que também querem apoiar a causa.
                Você ganha pontos por cada pessoa que se cadastrar usando seu link!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all overflow-hidden">
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

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-strong p-8 rounded-3xl space-y-4">
                <Sparkles className="w-10 h-10 text-accent" />
                <h3 className="text-xl font-bold">Seu Papel é Essencial</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Como apoiador, você ajuda a aumentar nossos números e fortalecer nossa capacidade de pressionar
                  autoridades por mudanças reais.
                </p>
              </div>

              <div className="glass-strong p-8 rounded-3xl space-y-4">
                <TrendingUp className="w-10 h-10 text-accent" />
                <h3 className="text-xl font-bold">Acompanhe o Progresso</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fique por dentro das votações ativas e veja como a comunidade está crescendo e conquistando seus
                  objetivos.
                </p>
              </div>
            </div>

            {/* Leaderboard Link */}
            <div className="glass-strong p-10 rounded-3xl border-2 border-primary/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Ranking da Comunidade</h3>
                  <p className="text-muted-foreground">Veja os membros mais engajados</p>
                </div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Descubra quem são os membros mais ativos da comunidade, quantos pontos conquistaram e quais badges
                desbloquearam. Inspire-se com os líderes comunitários!
              </p>
              <Button asChild size="lg" className="gradient-primary font-bold h-14 w-full sm:w-auto">
                <Link href="/leaderboard">
                  Ver Ranking Completo
                  <Trophy className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
