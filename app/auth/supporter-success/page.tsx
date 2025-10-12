import { Button } from "@/components/ui/button"
import { CheckCircle2, Heart } from "lucide-react"
import Link from "next/link"

export default function SupporterSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="w-full max-w-2xl text-center space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full gradient-primary">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h1 className="text-5xl lg:text-6xl font-black tracking-tighter">
            Bem-vindo à <span className="text-gradient">Causa!</span>
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Obrigado por se juntar a nós! Você receberá atualizações sobre nossas campanhas e como pode ajudar a fazer a
            diferença.
          </p>
        </div>

        <div className="glass-strong p-10 rounded-3xl space-y-6">
          <Heart className="w-12 h-12 mx-auto text-accent" />
          <p className="text-lg">
            Juntos somos mais fortes. Sua participação é fundamental para pressionar autoridades e conquistar direitos
            para a comunidade tetraplégica.
          </p>
        </div>

        <Button size="lg" className="gradient-primary font-bold h-14 px-12" asChild>
          <Link href="/">Voltar ao Início</Link>
        </Button>
      </div>
    </div>
  )
}
