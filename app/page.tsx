import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Vote, Trophy } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
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
              A primeira plataforma que une, fortalece e dá voz à comunidade tetraplégica do Brasil
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="gradient-primary font-bold text-lg h-16 px-10">
                <Link href="/auth/signup">
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
                Convide amigos e cresça nossa comunidade. Ganhe pontos e badges por cada conexão.
              </p>
            </div>

            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center">
                <Vote className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black">Vote</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Participe de votações e petições. Sua voz molda políticas e ações coletivas.
              </p>
            </div>

            <div className="glass-strong p-10 rounded-3xl space-y-6 hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black">Conquiste</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ganhe reconhecimento por suas contribuições. Desbloqueie badges e suba no ranking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="glass-strong p-16 rounded-3xl">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">1.2K+</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Membros</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">500+</p>
                <p className="text-xl text-muted-foreground uppercase tracking-wider font-bold">Votações</p>
              </div>
              <div className="space-y-4">
                <p className="text-7xl md:text-8xl font-black text-gradient">50K+</p>
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
              Junte-se a centenas de brasileiros construindo uma comunidade mais forte
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-bold text-lg h-16 px-10 bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/auth/signup">
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
              <Link href="#" className="hover:text-foreground transition-colors">
                Instagram
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
