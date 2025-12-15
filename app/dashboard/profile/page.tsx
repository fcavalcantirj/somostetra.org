import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, CheckCircle } from "lucide-react"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if supporter - redirect to supporter dashboard
  const { data: supporter } = await supabase
    .from("supporters")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (supporter) {
    redirect("/supporter-dashboard")
  }

  // Fetch user profile with all fields
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/dashboard")
  }

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex items-center gap-4 max-w-full">
          <Link
            href="/dashboard"
            className="glass p-2 rounded-lg hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              Completar Perfil
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.profile_completed ? (
                <span className="flex items-center gap-1 text-primary">
                  <CheckCircle className="h-4 w-4" />
                  Perfil completo
                </span>
              ) : (
                "Complete seu perfil e ganhe 50 pontos!"
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl">
        <ProfileForm
          profile={profile}
          userEmail={user.email || ""}
          isMember={isMember}
        />
        </div>
      </main>
    </div>
  )
}
