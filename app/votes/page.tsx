import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowLeft, Plus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function VotesPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()

  const isAdmin = profile?.is_admin === true

  // Fetch all active votes
  const { data: votes } = await supabase
    .from("votes")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  // Fetch user's votes
  const { data: userVotes } = await supabase.from("user_votes").select("vote_id").eq("user_id", user.id)

  const userVoteIds = new Set(userVotes?.map((v) => v.vote_id) || [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between max-w-full">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <Button asChild variant="outline" className="glass-strong font-bold bg-transparent">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter break-words">
              <span className="text-gradient">Votações</span> Ativas
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Participe das decisões da comunidade e ganhe pontos por cada voto
            </p>
          </div>

          {searchParams.error === "admin_only" && (
            <Alert className="glass-strong border-accent/50 mb-8">
              <AlertCircle className="h-5 w-5 text-accent" />
              <AlertTitle className="text-xl font-bold">Apenas administradores podem criar votações</AlertTitle>
              <AlertDescription className="text-base mt-2">
                Para propor uma nova votação, entre em contato com um administrador da comunidade.
              </AlertDescription>
            </Alert>
          )}

          {isAdmin && (
            <div className="mb-12">
              <Button
                size="lg"
                className="gradient-primary font-bold h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto"
                asChild
              >
                <Link href="/votes/create">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Nova Votação
                </Link>
              </Button>
            </div>
          )}

          {votes && votes.length > 0 ? (
            <div className="space-y-6">
              {votes.map((vote) => {
                const hasVoted = userVoteIds.has(vote.id)
                return (
                  <div
                    key={vote.id}
                    className="glass-strong p-8 rounded-3xl space-y-6 hover:scale-[1.01] transition-transform"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <Badge className={hasVoted ? "gradient-primary font-bold" : "gradient-accent font-bold"}>
                            {hasVoted ? "Você votou" : "Ativa"}
                          </Badge>
                          <Badge variant="outline" className="ml-2 font-bold">
                            {vote.category}
                          </Badge>
                        </div>
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-black leading-tight">{vote.title}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">{vote.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground font-bold">
                        <Users className="w-4 h-4 inline mr-1" />
                        {vote.vote_count} votos
                      </p>
                      <Button size="lg" className="gradient-primary font-bold h-12 px-8" asChild>
                        <Link href={`/votes/${vote.id}`}>{hasVoted ? "Ver Resultados" : "Votar Agora"}</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass-strong p-12 rounded-3xl text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl gradient-primary/20 flex items-center justify-center mx-auto">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-black">Nenhuma votação ativa</h3>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Seja o primeiro a criar uma votação e engajar a comunidade!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
