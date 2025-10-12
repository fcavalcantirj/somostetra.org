import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function BadgesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all badges
  const { data: allBadges } = await supabase.from("badges").select("*").order("points_required", { ascending: true })

  // Fetch user's earned badges
  const { data: userBadges } = await supabase.from("user_badges").select("badge_id").eq("user_id", user.id)

  const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || [])

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
              Suas <span className="text-gradient">Conquistas</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Você tem {earnedBadgeIds.size} de {allBadges?.length || 0} badges
            </p>
          </div>

          <div className="mb-12 glass-strong p-8 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Seus Pontos</p>
                <p className="text-5xl font-black text-gradient">{profile?.points || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Próxima Badge</p>
                <p className="text-2xl font-black">
                  {allBadges?.find((b) => b.points_required > (profile?.points || 0))?.points_required || "Max"} pts
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBadges?.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id)
              const canEarn = (profile?.points || 0) >= badge.points_required

              return (
                <div
                  key={badge.id}
                  className={`glass-strong p-8 rounded-3xl space-y-6 ${
                    isEarned ? "border-2 border-primary/30" : canEarn ? "border-2 border-accent/30" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl ${
                        isEarned ? "gradient-primary" : canEarn ? "gradient-accent" : "bg-muted-foreground/20"
                      }`}
                    >
                      {isEarned || canEarn ? badge.icon : <Lock className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    {isEarned && <Badge className="gradient-primary font-bold">Conquistada</Badge>}
                    {!isEarned && canEarn && <Badge className="gradient-accent font-bold">Disponível</Badge>}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black">{badge.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">{badge.description}</p>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm font-bold text-muted-foreground">
                      Requer: <span className="text-foreground">{badge.points_required} pontos</span>
                    </p>
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
