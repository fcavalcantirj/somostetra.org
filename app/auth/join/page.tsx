"use client"

import { Button } from "@/components/ui/button"
import { Users, Heart, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function JoinPage() {
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref")
  const refParam = referralCode ? `?ref=${referralCode}` : ""

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <Link href="/" className="inline-block text-3xl font-bold">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>

          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
            Como você quer <span className="text-gradient">participar</span>?
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Escolha a opção que melhor descreve você e junte-se à nossa comunidade
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Member Card */}
          <div className="glass-strong p-10 rounded-3xl space-y-8 hover:scale-[1.02] transition-transform">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                <Users className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black">Sou Tetraplégico</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Faça parte da comunidade, vote em petições, convide amigos e ganhe reconhecimento
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Participe de votações e petições</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Ganhe pontos e badges por contribuições</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Convide membros e apoiadores</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Acesse dashboard completo</p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full gradient-primary font-bold h-14 text-lg">
              <Link href={`/auth/signup${refParam}`}>
                Cadastrar como Membro
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Supporter Card */}
          <div className="glass-strong p-10 rounded-3xl space-y-8 hover:scale-[1.02] transition-transform">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center">
                <Heart className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black">Quero Apoiar</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Fortaleça nossa voz coletiva e ajude a pressionar autoridades por mudanças reais
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Amplifique nossa causa</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Convide outros apoiadores</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Acompanhe seu impacto</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">Receba atualizações da comunidade</p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full gradient-accent font-bold h-14 text-lg">
              <Link href={`/auth/supporter-signup${refParam}`}>
                Cadastrar como Apoiador
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="text-accent hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
