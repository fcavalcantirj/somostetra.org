import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, TrendingUp, Share2, Sparkles } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { CopyButton } from "@/components/copy-button"

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

  // Fetch active votes count
  const { count: activeVotesCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Fetch total members count
  const { count: membersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  // Fetch total supporters count
  const { count: supportersCount } = await supabase.from("supporters").select("*", { count: "exact", head: true })

  const supporterLink = referrerInfo
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup?ref=${referrerInfo.referral_code}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup`

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between max-w-full">
          <Link href="/" className="text-2xl font-bold tracking-tight">
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
              <p className="text-6xl font-black text-gradient">{activeVotesCount || 0}</p>
              <p className="text-muted-foreground">Em andamento</p>
            </div>
          </div>

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

            <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Convide Mais Apoiadores</h3>
                  <p className="text-muted-foreground">Quanto mais somos, mais forte é nossa voz</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Compartilhe este link com amigos e familiares que também querem apoiar a causa. Juntos, podemos
                pressionar autoridades e conquistar direitos para a comunidade tetraplégica!
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
          </div>
        </div>
      </main>
    </div>
  )
}
