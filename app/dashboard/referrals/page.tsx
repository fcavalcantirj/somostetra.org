import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Heart, ArrowLeft, Calendar, Mail, Trophy } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"

export default async function ReferralsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch all referred members with details
  const { data: referredMembers } = await supabase
    .from("profiles")
    .select("id, display_name, created_at, points, user_type, username, profile_public")
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false })

  // Fetch all referred supporters with details
  const { data: referredSupporters } = await supabase
    .from("supporters")
    .select("id, name, email, created_at")
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false })

  const memberCount = referredMembers?.length || 0
  const supporterCount = referredSupporters?.length || 0
  const totalCount = memberCount + supporterCount

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
          <LogoutButton />
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12">
            <Button variant="ghost" className="mb-6 font-bold" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-black tracking-tighter">
                Seus <span className="text-gradient">Convidados</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Você trouxe <span className="font-bold text-accent">{totalCount}</span> pessoas para a comunidade
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Membros</h3>
                  <p className="text-sm text-muted-foreground">Pessoas tetraplégicas</p>
                </div>
              </div>
              <p className="text-5xl font-black text-gradient">{memberCount}</p>
              <p className="text-sm text-muted-foreground">
                Você ganhou <span className="font-bold text-accent">{memberCount * 20} pontos</span>
              </p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4 border-2 border-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Apoiadores</h3>
                  <p className="text-sm text-muted-foreground">Pessoas engajadas</p>
                </div>
              </div>
              <p className="text-5xl font-black text-gradient">{supporterCount}</p>
              <p className="text-sm text-muted-foreground">
                Você ganhou <span className="font-bold text-accent">{supporterCount * 10} pontos</span>
              </p>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-3xl font-black">Membros Convidados</h2>
              <Badge className="gradient-primary font-bold">{memberCount}</Badge>
            </div>

            {referredMembers && referredMembers.length > 0 ? (
              <div className="space-y-4">
                {referredMembers.map((member) => (
                  <div key={member.id} className="glass-strong p-6 rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {member.profile_public && member.username ? (
                            <Link
                              href={`/p/${member.username}`}
                              className="text-xl font-bold hover:text-primary transition-colors"
                            >
                              {member.display_name}
                            </Link>
                          ) : (
                            <h3 className="text-xl font-bold">{member.display_name}</h3>
                          )}
                          <Badge variant="outline" className="font-bold">
                            Membro
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Entrou em {new Date(member.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            <span className="font-bold text-accent">{member.points} pontos</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Você ganhou</p>
                        <p className="text-2xl font-black text-gradient">+20 pts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-strong p-12 rounded-3xl text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Nenhum membro convidado ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Compartilhe seu link de convite para começar a ganhar pontos!
                </p>
              </div>
            )}
          </div>

          {/* Supporters List */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h2 className="text-3xl font-black">Apoiadores Convidados</h2>
              <Badge className="gradient-accent font-bold">{supporterCount}</Badge>
            </div>

            {referredSupporters && referredSupporters.length > 0 ? (
              <div className="space-y-4">
                {referredSupporters.map((supporter) => (
                  <div key={supporter.id} className="glass-strong p-6 rounded-2xl border-2 border-accent/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{supporter.name}</h3>
                          <Badge variant="outline" className="border-accent/30 text-accent font-bold">
                            Apoiador
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {supporter.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{supporter.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Entrou em {new Date(supporter.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Você ganhou</p>
                        <p className="text-2xl font-black text-gradient">+10 pts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-strong p-12 rounded-3xl text-center border-2 border-accent/20">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Nenhum apoiador convidado ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Compartilhe seu link de apoiador para trazer mais pessoas engajadas!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
