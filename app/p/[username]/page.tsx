import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { User, Calendar, MapPin, Award, Heart, ExternalLink, Sparkles, Star } from "lucide-react"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { HelpWishButton } from "@/components/help-wish-button"

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("username", username)
    .eq("profile_public", true)
    .single()

  if (!profile) {
    return {
      title: "Perfil não encontrado | SomosTetra",
    }
  }

  return {
    title: `${profile.display_name} | SomosTetra`,
    description: profile.bio || `Conheça ${profile.display_name} na comunidade SomosTetra`,
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch public profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      bio,
      bio_public,
      user_type,
      username,
      city,
      state,
      profile_picture_url,
      profile_public,
      created_at
    `)
    .eq("username", username)
    .eq("profile_public", true)
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch user badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badges(*)")
    .eq("user_id", profile.id)
    .order("earned_at", { ascending: false })

  // Fetch approved wishes for this member
  const { data: wishes } = await supabase
    .from("wishes")
    .select(`
      id,
      content,
      wish_categories(icon, name)
    `)
    .eq("user_id", profile.id)
    .eq("status", "approved")
    .order("approved_at", { ascending: false })

  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  })

  const isMember = profile.user_type === "member"

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between max-w-full">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <Button asChild className="gradient-primary font-bold">
            <Link href="/auth/signup">
              Fazer parte
            </Link>
          </Button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl">
          {/* Profile Card */}
          <div className="glass-strong p-8 sm:p-12 rounded-3xl mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Profile Picture */}
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/30 bg-muted flex-shrink-0 shadow-xl shadow-primary/20">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <User className="w-20 h-20 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
                  {profile.display_name}
                </h1>

                <div className="space-y-2 mb-6">
                  {/* Location */}
                  {(profile.city || profile.state) && (
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[profile.city, profile.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Member Since */}
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Membro desde {memberSince}</span>
                  </div>
                </div>

                {/* Bio - only show if bio_public is true */}
                {profile.bio && profile.bio_public && (
                  <p className="text-lg text-muted-foreground max-w-xl mb-6">{profile.bio}</p>
                )}

                {/* Member Badge */}
                {isMember && (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary font-semibold">
                    <Heart className="h-4 w-4" />
                    <span>Pessoa com Tetraplegia</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          {userBadges && userBadges.length > 0 && (
            <div className="glass-strong p-8 rounded-3xl mb-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Award className="h-6 w-6 text-accent" />
                Conquistas
              </h2>
              <div className="flex flex-wrap gap-4">
                {userBadges.map((ub: { id: string; badges: { name: string; icon: string; description: string } }) => (
                  <div
                    key={ub.id}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl glass border border-border/50 hover:scale-105 transition-transform"
                    title={ub.badges.description}
                  >
                    <span className="text-2xl">{ub.badges.icon}</span>
                    <span className="font-semibold">{ub.badges.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wishes */}
          {wishes && wishes.length > 0 && (
            <div className="glass-strong p-8 rounded-3xl mb-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Star className="h-6 w-6 text-accent" />
                Desejos
              </h2>
              <div className="space-y-4">
                {wishes.map((wish) => {
                  const category = wish.wish_categories as { icon: string; name: string }[] | null
                  return (
                    <div
                      key={wish.id}
                      className="p-5 rounded-2xl glass border border-border/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">{category?.[0]?.icon || "🙏"}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-lg leading-relaxed">{wish.content}</p>
                          <div className="flex items-center justify-between mt-3">
                            {category?.[0]?.name && (
                              <p className="text-sm text-muted-foreground">{category[0].name}</p>
                            )}
                            <HelpWishButton
                              wishId={wish.id}
                              memberName={profile.display_name}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">Junte-se a nós</span>
            </div>
            <p className="text-xl text-muted-foreground mb-6">
              Quer fazer parte da comunidade SomosTetra?
            </p>
            <Button asChild size="lg" className="gradient-primary font-bold h-14 px-10 text-lg">
              <Link href="/auth/signup">
                Cadastre-se gratuitamente
                <ExternalLink className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-border/50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 text-center text-muted-foreground">
          <p className="font-medium">SomosTetra - Comunidade de pessoas com tetraplegia</p>
        </div>
      </footer>
    </div>
  )
}
