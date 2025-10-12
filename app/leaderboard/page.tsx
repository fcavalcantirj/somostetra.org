import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id, display_name, points, created_at")
    .order("points", { ascending: false })
    .limit(50)

  const userRank = leaderboard?.findIndex((p) => p.id === user.id) ?? -1
  const userProfile = leaderboard?.find((p) => p.id === user.id)

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
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              <span className="text-gradient">Ranking</span> da Comunidade
            </h1>
            <p className="text-xl text-muted-foreground">Os membros mais engajados da SomosTetra</p>
          </div>

          {userRank >= 0 && (
            <div className="mb-12 glass-strong p-8 rounded-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center">
                    <span className="text-3xl font-black">{userRank + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Sua Posição</p>
                    <p className="text-3xl font-black">{userProfile?.display_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Pontos</p>
                  <p className="text-4xl font-black text-gradient">{userProfile?.points || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {leaderboard?.map((member, index) => {
              const isCurrentUser = member.id === user.id
              const isTop3 = index < 3

              return (
                <div
                  key={member.id}
                  className={`glass-strong p-6 rounded-3xl ${
                    isCurrentUser ? "border-2 border-accent/30" : isTop3 ? "border-2 border-primary/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        index === 0
                          ? "gradient-primary"
                          : index === 1
                            ? "gradient-accent"
                            : index === 2
                              ? "gradient-primary"
                              : "bg-muted-foreground/20"
                      }`}
                    >
                      {index === 0 ? (
                        <Trophy className="w-8 h-8" />
                      ) : index === 1 ? (
                        <Medal className="w-8 h-8" />
                      ) : index === 2 ? (
                        <Award className="w-8 h-8" />
                      ) : (
                        <span className="text-2xl font-black">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-xl font-black">{member.display_name}</p>
                        {isCurrentUser && <Badge className="gradient-accent font-bold">Você</Badge>}
                        {isTop3 && !isCurrentUser && <Badge className="gradient-primary font-bold">Top 3</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Membro desde {new Date(member.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-black text-gradient">{member.points}</p>
                      <p className="text-sm text-muted-foreground font-bold">pontos</p>
                    </div>

                    {isCurrentUser && <TrendingUp className="w-6 h-6 text-accent" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
