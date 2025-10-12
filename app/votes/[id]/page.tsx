import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VoteButton } from "@/components/vote-button"

export default async function VoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch vote details
  const { data: vote } = await supabase.from("votes").select("*").eq("id", id).single()

  if (!vote) {
    redirect("/votes")
  }

  // Check if user has voted
  const { data: userVote } = await supabase
    .from("user_votes")
    .select("*")
    .eq("user_id", user.id)
    .eq("vote_id", id)
    .single()

  const hasVoted = !!userVote

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <Button asChild variant="outline" className="glass-strong font-bold bg-transparent">
            <Link href="/votes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Todas as Votações
            </Link>
          </Button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-strong p-12 rounded-3xl space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 flex-wrap">
                <Badge className={hasVoted ? "gradient-primary font-bold" : "gradient-accent font-bold"}>
                  {hasVoted ? "Você votou" : "Ativa"}
                </Badge>
                <Badge variant="outline" className="font-bold">
                  {vote.category}
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black leading-tight">{vote.title}</h1>

              <p className="text-xl text-muted-foreground leading-relaxed">{vote.description}</p>

              <div className="flex items-center gap-6 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground font-bold">
                  <Users className="w-4 h-4 inline mr-1" />
                  {vote.vote_count} votos
                </p>
                <p className="text-sm text-muted-foreground font-bold">
                  Status: <span className="text-foreground">{vote.status === "active" ? "Ativa" : "Encerrada"}</span>
                </p>
              </div>
            </div>

            {hasVoted ? (
              <div className="glass p-8 rounded-2xl space-y-4 border-2 border-primary/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-black">Você já votou nesta pauta!</h3>
                </div>
                <p className="text-lg text-muted-foreground">
                  Obrigado por participar. Você ganhou <span className="text-accent font-bold">5 pontos</span> por este
                  voto.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="glass p-8 rounded-2xl space-y-4">
                  <h3 className="text-2xl font-black">Participe desta votação</h3>
                  <p className="text-lg text-muted-foreground">
                    Ao votar, você ganha <span className="text-accent font-bold">5 pontos</span> e ajuda a comunidade a
                    tomar decisões importantes.
                  </p>
                </div>

                <VoteButton voteId={vote.id} userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
