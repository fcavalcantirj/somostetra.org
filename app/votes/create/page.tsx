import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateVoteForm } from "@/components/create-vote-form"

export default async function CreateVotePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/votes/create")
  }

  const { data: profile, error } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()

  console.log("[v0] Profile check:", { profile, error, userId: user.id })

  const isAdmin = profile?.is_admin === true

  if (!isAdmin) {
    redirect("/votes?error=admin_only")
  }

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
            <Link href="/votes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-12 space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              Criar <span className="text-gradient">Votação</span>
            </h1>
            <p className="text-xl text-muted-foreground">Proponha uma pauta importante para a comunidade decidir</p>
          </div>

          <CreateVoteForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
