"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Sparkles,
  Users,
  Vote,
  Trophy,
  Gift,
  Zap,
  Target,
  Heart,
  Star,
  Microscope,
  Globe,
  Bell,
  Search,
  MapPin,
  Link as LinkIcon,
  User,
} from "lucide-react"
import Link from "next/link"
import { HelpWishButton } from "@/components/help-wish-button"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  trackReferralClick,
  trackLeaderboardView,
  trackHowItWorksInteraction,
  trackSectionView,
  trackHomepageCTA,
  trackSignupPathChosen,
} from "@/lib/analytics"
import { createClient } from "@/lib/supabase/client"

export default function LandingPage() {
  const searchParams = useSearchParams()
  const [members, setMembers] = useState(0)
  const [supporters, setSupporters] = useState(0)
  const [votes, setVotes] = useState(0)
  const [votesCast, setVotesCast] = useState(0)
  const [connections, setConnections] = useState(0)
  const [badges, setBadges] = useState(0)
  const [wishesFulfilled, setWishesFulfilled] = useState(0)
  const [wishes, setWishes] = useState<{
    id: string
    content: string
    profiles: { display_name: string; username: string | null; profile_public: boolean }[] | null
    wish_categories: { icon: string }[] | null
  }[]>([])

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
          "total_members, total_supporters, total_votes, total_votes_cast, total_connections, total_badges_earned, total_wishes_fulfilled",
        )
        .single()

      setMembers(stats?.total_members || 0)
      setSupporters(stats?.total_supporters || 0)
      setVotes(stats?.total_votes || 0)
      setVotesCast(stats?.total_votes_cast || 0)
      setConnections(stats?.total_connections || 0)
      setBadges(stats?.total_badges_earned || 0)
      setWishesFulfilled(stats?.total_wishes_fulfilled || 0)

      // Fetch approved wishes
      const { data: wishesData } = await supabase
        .from("wishes")
        .select(`
          id,
          content,
          profiles!wishes_user_id_fkey(display_name, username, profile_public),
          wish_categories(icon)
        `)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(6)

      if (wishesData) {
        setWishes(wishesData as typeof wishes)
      }
    }

    fetchStats()
  }, [])

  // Track all section views for analytics
  useEffect(() => {
    const sectionIds = ["sobre", "clinical-trials", "desejos", "perfil-publico", "comunidade", "como-funciona"]
    const observers: IntersectionObserver[] = []

    sectionIds.forEach((id) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              trackSectionView(id)
              if (id === "como-funciona") {
                trackHowItWorksInteraction("view")
              }
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.3 },
      )

      const section = document.getElementById(id)
      if (section) {
        observer.observe(section)
        observers.push(observer)
      }
    })

    return () => observers.forEach((o) => o.disconnect())
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
              A primeira plataforma que conecta a comunidade tetraplégica do Brasil a estudos clínicos, realiza desejos e amplifica sua voz. Juntos, construímos mudanças reais.
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

      {/* NEW 3 PILLARS - Clinical Trials, Wishes, Public Profile */}
      <section id="sobre" className="py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1: Clinical Trials */}
            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <Microscope className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black">Estudos Clínicos</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Receba notificações de estudos que podem mudar sua vida. Conectamos você a pesquisas relevantes.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => trackHomepageCTA("pillar_clinical_trials", "join")}
              >
                <Link href="/auth/join">
                  Buscar Estudos
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Pillar 2: Wishes */}
            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black">Desejos</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A comunidade se une para ajudar você. Compartilhe suas necessidades e receba apoio.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-accent/50 text-accent hover:bg-accent/10"
                onClick={() => trackHomepageCTA("pillar_wishes", "join")}
              >
                <Link href="/auth/join">
                  Criar Desejo
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Pillar 3: Public Profile */}
            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black">Sua História</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Seu link pessoal para o mundo. Compartilhe sua jornada e conecte-se com quem importa.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => trackHomepageCTA("pillar_public_profile", "join")}
              >
                <Link href="/auth/join">
                  Criar Meu Perfil
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Trials Highlight Section */}
      <section id="clinical-trials" className="py-32 px-6 lg:px-12 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
                <Microscope className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider">Estudos Clínicos</span>
              </div>

              <h2 className="text-5xl md:text-6xl font-black leading-tight">
                Estudos que podem <span className="text-primary">mudar sua vida</span>
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Conectamos você a pesquisas clínicas relevantes para sua condição. Receba notificações automáticas quando
                novos estudos surgirem na sua região.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Busca por Localização</h4>
                    <p className="text-muted-foreground">Encontre estudos próximos a você, em qualquer estado do Brasil</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Notificações Personalizadas</h4>
                    <p className="text-muted-foreground">
                      Seja avisado quando estudos compatíveis com seu perfil forem publicados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Filtros Avançados</h4>
                    <p className="text-muted-foreground">Filtre por fase, status e condições específicas</p>
                  </div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-10"
                onClick={() => {
                  trackHomepageCTA("clinical_trials_section", "join")
                  trackSignupPathChosen("clinical_trials")
                }}
              >
                <Link href="/auth/join">
                  Cadastre-se para ser notificado
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Right: Visual */}
            <div className="glass-strong p-8 rounded-3xl">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center space-y-6">
                  <Microscope className="w-24 h-24 text-primary mx-auto" />
                  <div>
                    <p className="text-4xl font-black text-primary">ClinicalTrials.gov</p>
                    <p className="text-muted-foreground">Dados atualizados diretamente da fonte oficial</p>
                  </div>
                </div>
              </div>
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

      {/* Public Profile Section */}
      <section id="perfil-publico" className="py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Visual */}
            <div className="glass-strong p-8 rounded-3xl order-2 lg:order-1">
              <div className="space-y-6">
                <div className="glass p-4 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">somostetra.org/p/</span>
                    <span className="font-bold text-primary">seunome</span>
                  </div>
                  <div className="h-px bg-border mb-4" />
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Seu Nome</p>
                      <p className="text-sm text-muted-foreground">Sua história, seus desejos, suas conquistas</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="glass p-4 rounded-xl text-center">
                    <Star className="w-6 h-6 text-accent mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Desejos</p>
                  </div>
                  <div className="glass p-4 rounded-xl text-center">
                    <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Badges</p>
                  </div>
                  <div className="glass p-4 rounded-xl text-center">
                    <Microscope className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Estudos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-wider">Perfil Público</span>
              </div>

              <h2 className="text-5xl md:text-6xl font-black leading-tight">
                Seu link <span className="text-gradient">pessoal</span> para o mundo
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Crie sua página pública e compartilhe sua história. Mostre seus desejos, conquistas e
                conecte-se com pessoas que querem ajudar.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg">Link único e fácil de compartilhar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Microscope className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-lg">Acesse estudos clínicos relevantes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-lg">Mostre seus desejos e conquistas</span>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="gradient-primary font-bold h-14 px-10 text-lg"
                onClick={() => {
                  trackHomepageCTA("public_profile_section", "join")
                  trackSignupPathChosen("public_profile")
                }}
              >
                <Link href="/auth/join">
                  Criar Meu Perfil Público
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section id="comunidade" className="py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="glass-strong p-16 rounded-3xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{members}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Membros</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{supporters}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Apoiadores</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{wishesFulfilled}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Desejos Realizados</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">{votesCast}</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Votos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Wishes Section */}
      {wishes.length > 0 && (
        <section id="desejos" className="py-32 px-6 lg:px-12 bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
                <Star className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold uppercase tracking-wider">Desejos da Comunidade</span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                CONECTAMOS QUEM <span className="text-gradient">PRECISA</span>
                <br />
                COM QUEM PODE <span className="text-gradient">AJUDAR</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Nós somos a ponte entre necessidades e solidariedade. A comunidade se une para transformar desejos em
                realidade.
              </p>

              {/* Fulfilled Wishes Counter */}
              {wishesFulfilled > 0 && (
                <div className="inline-flex items-center gap-3 glass-strong px-8 py-4 rounded-2xl">
                  <Heart className="w-6 h-6 text-pink-500" />
                  <span className="text-2xl font-black text-gradient">{wishesFulfilled}</span>
                  <span className="text-lg text-muted-foreground font-semibold">desejos já realizados</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishes.map((wish) => (
                <div
                  key={wish.id}
                  className="glass-strong p-6 rounded-2xl space-y-4 hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{wish.wish_categories?.[0]?.icon || "🙏"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {wish.profiles?.[0]?.profile_public && wish.profiles?.[0]?.username ? (
                        <Link
                          href={`/p/${wish.profiles[0].username}`}
                          className="font-semibold text-sm text-primary underline decoration-primary/40 hover:decoration-primary transition-colors"
                        >
                          {wish.profiles[0].display_name || "Membro"}
                        </Link>
                      ) : (
                        <p className="font-semibold text-sm text-muted-foreground">
                          {wish.profiles?.[0]?.display_name || "Membro"}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed line-clamp-3">{wish.content}</p>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <Heart className="w-4 h-4" />
                      <span>Desejo ativo</span>
                    </div>
                    <HelpWishButton wishId={wish.id} memberName={wish.profiles?.[0]?.display_name || "o membro"} />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-6">Quer ajudar a realizar um desses desejos ou criar o seu?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="gradient-accent font-bold text-lg h-14 px-10"
                  onClick={() => trackHomepageCTA("wishes_help", "join")}
                >
                  <Link href="/auth/join">
                    Quero Ajudar
                    <Heart className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="glass-strong font-bold text-lg h-14 px-10 bg-transparent"
                  onClick={() => {
                    trackHomepageCTA("wishes_create", "join")
                    trackSignupPathChosen("wishes")
                  }}
                >
                  <Link href="/auth/join">
                    Criar Meu Desejo
                    <Star className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

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
