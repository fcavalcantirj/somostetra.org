import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 rounded-3xl text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-2">Verifique seu email</h1>
          <p className="text-muted-foreground mb-6">
            Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta e começar a usar o
            SomosTetra.
          </p>

          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/auth/login">Voltar para login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
