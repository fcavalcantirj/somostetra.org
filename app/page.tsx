"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Vote, Trophy, Gift, Zap, Target } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { trackReferralClick, trackLeaderboardView, trackHowItWorksInteraction } from "@/lib/analytics"
import { createClient } from "@/lib/supabase/client"

export default function LandingPage() {
  const searchParams = useSearchParams()
  const [members, setMembers] = useState(0)
  const [supporters, setSupporters] = useState(0)
  const [votes, setVotes] = useState(0)
  const [votesCast, setVotesCast] = useState(0)
  const [connections, setConnections] = useState(0)
  const [badges, setBadges] = useState(0)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) {
      const path = window.location.pathname
      const type = path.includes("supporter") ? "supporter" : "member"
      trackReferralClick(type)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      const { data: stats } = await supabase
        .from("platform_statistics")
        .select(
          "total_members, total_supporters, total_votes, total_votes_cast, total_connections, total_badges_earned",
        )
        .single()

      setMembers(stats?.total_members || 0)
      setSupporters(stats?.total_supporters || 0)
      setVotes(stats?.total_votes || 0)
      setVotesCast(stats?.total_votes_cast || 0)
      setConnections(stats?.total_connections || 0)
      setBadges(stats?.total_badges_earned || 0)
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackHowItWorksInteraction("view")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 },
    )

    const section = document.getElementById("como-funciona")
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#sobre"
              className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              Sobre
            </Link>
            <Link
              href="#comunidade"
              className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              Comunidade
            </Link>
            <Link
              href="#contato"
              className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
            >
              Contato
            </Link>
          </nav>
          <Button asChild className="gradient-primary font-bold">
            <Link href="/auth/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <section className="pt-40 pb-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-12 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">Bem-vindo à Comunidade</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter">
              JUNTOS
              <br />
              <span className="text-gradient">SOMOS</span>
              <br />
              MAIS FORTES
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A primeira plataforma que une, fortalece e dá voz à comunidade tetraplégica do Brasil. Juntos, construímos mudanças reais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="gradient-primary font-bold text-lg h-16 px-10">
                <Link href="/auth/join">
                  Começar Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="glass-strong font-bold text-lg h-16 px-10 bg-transparent">
                <Link href="#sobre">Saber Mais</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black">Conecte-se</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Cada nova conexão fortalece nossa voz. Juntos, somos ouvidos.
              </p>
            </div>

            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center">
                <Vote className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black">Vote</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Sua opinião importa. Cada voto molda o futuro que queremos ver.
              </p>
            </div>

            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black">Conquiste</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Seu engajamento é reconhecido e celebrado. Faça parte dos líderes que transformam.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-32 px-6 lg:px-12 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
              COMO <span className="text-gradient">FUNCIONA</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ganhe pontos, desbloqueie badges e suba no ranking enquanto fortalece nossa comunidade
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <div className="glass-strong p-10 rounded-3xl space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Gift className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">Cadastre-se e Ganhe</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    <span className="font-bold text-primary">+10 pontos</span> ao criar sua conta. Comece sua jornada na
                    comunidade com pontos de boas-vindas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center flex-shrink-0">
                  <Vote className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">Vote e Participe</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    <span className="font-bold text-accent">+5 pontos</span> por cada votação. Sua opinião importa e é
                    recompensada.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">Convide Membros</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    <span className="font-bold text-primary">+20 pontos</span> por cada membro tetraplégico que você
                    trouxer. Fortaleça nossa voz coletiva.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">Traga Apoiadores</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    <span className="font-bold text-accent">+10 pontos</span> por cada apoiador. Amplie o alcance da
                    nossa causa.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-strong p-10 rounded-3xl space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-7 h-7" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black">Desbloqueie Badges</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Acompanhe sua evolução e conquiste badges conforme acumula pontos:
                  </p>
                  <div className="space-y-4">
                    {/* Primeiro Passo - 1 ponto */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground">🎯 Primeiro Passo</span>
                        <span className="text-muted-foreground">1 pts</span>
                      </div>
                      <div className="h-2 glass rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent w-[2%]" />
                      </div>
                    </div>

                    {/* Engajado - 50 pontos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground">⭐ Engajado</span>
                        <span className="text-muted-foreground">50 pts</span>
                      </div>
                      <div className="h-2 glass rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent w-[30%]" />
                      </div>
                    </div>

                    {/* Influenciador - 100 pontos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground">🌟 Influenciador</span>
                        <span className="text-muted-foreground">100 pts</span>
                      </div>
                      <div className="h-2 glass rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent w-[50%]" />
                      </div>
                    </div>

                    {/* Ativista - 150 pontos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground">🗳️ Ativista</span>
                        <span className="text-muted-foreground">150 pts</span>
                      </div>
                      <div className="h-2 glass rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent w-[70%]" />
                      </div>
                    </div>

                    {/* Líder Comunitário - 500 pontos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-accent">👑 Líder Comunitário</span>
                        <span className="text-accent font-bold">500 pts</span>
                      </div>
                      <div className="h-2 glass rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-accent to-primary w-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center flex-shrink-0">
                  <Target className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">Suba no Ranking</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Apareça no leaderboard e seja reconhecido como um dos membros mais ativos da comunidade. Quanto mais
                    você participa, mais visibilidade ganha.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="glass-strong font-bold bg-transparent mt-4"
                    onClick={() => trackLeaderboardView("homepage")}
                  >
                    <Link href="/leaderboard">
                      Ver Ranking Completo
                      <Trophy className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">Impacto Real</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Seus pontos não são apenas números - são a medida do quanto você ajuda a transformar nossa comunidade. Cada ação conta. Cada voz importa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="gradient-primary font-bold text-lg h-16 px-10"
              onClick={() => trackHowItWorksInteraction("cta_click")}
            >
              <Link href="/auth/join">
                Começar a Ganhar Pontos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="comunidade" className="py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="glass-strong p-16 rounded-3xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{members}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Membros</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{supporters}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Apoiadores</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{votes}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Votações</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{votesCast}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Votos</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{badges}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Badges</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{connections}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Conexões</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="gradient-primary p-16 rounded-3xl text-center space-y-8">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
              PRONTO PARA
              <br />
              FAZER PARTE?
            </h2>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              Sua voz pode mudar vidas. Junte-se a nós e faça parte de algo maior.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-bold text-lg h-16 px-10 bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/auth/join">
                Cadastrar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 lg:px-12 border-t border-border/50">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-2xl font-black tracking-tight">
              SOMOS<span className="text-gradient">TETRA</span>
            </div>
            <div className="flex gap-8 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Link
                href="https://instagram.com/sou.tetra"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Instagram
              </Link>
              <Link
                href="https://linkedin.com/company/sou-tetra"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                LinkedIn
              </Link>
              <Link href="/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
