import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Gift, Lock, ArrowRight, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WishList } from "./wish-list"
import { CreateWishForm } from "./create-wish-form"
import { ActiveWishBanner } from "./active-wish-banner"
import { getTranslations } from "next-intl/server"

export default async function WishesPage() {
  const t = await getTranslations("wishesPage")
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Check if supporter
  const { data: supporter } = await supabase
    .from("supporters")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (supporter) {
    redirect("/supporter-dashboard")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, display_name")
    .eq("id", user.id)
    .single()

  const isUnlocked = profile?.profile_completed === true

  // Fetch user's wishes
  const { data: wishes } = await supabase
    .from("wishes")
    .select(`
      *,
      wish_categories (
        id,
        name,
        icon
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Check if user has an active wish (pending or approved)
  const hasActiveWish = wishes?.some(w => w.status === "pending" || w.status === "approved") ?? false

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex items-center justify-between max-w-full">
          <Link href="/dashboard" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{t("backToDashboard")}</span>
          </Link>
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl">
          {/* Page Header */}
          <div className="mb-12 space-y-6">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Gift className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">{t("badge")}</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tighter">
              {t("title")} <span className="text-gradient">{t("titleHighlight")}</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          {!isUnlocked ? (
            /* Locked State - Profile not complete */
            <div className="glass-strong p-12 rounded-3xl text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-black">{t("locked.title")}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("locked.description")}
              </p>
              <Button asChild className="gradient-primary font-bold">
                <Link href="/dashboard/profile">
                  {t("locked.cta")}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          ) : (
            /* Unlocked State */
            <div className="space-y-8">
              {/* Create Wish Form - only show if no active wish */}
              {!hasActiveWish && (
                <div className="glass-strong p-8 rounded-3xl">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <Plus className="h-5 w-5 text-primary" />
                    {t("createNew")}
                  </h2>
                  <CreateWishForm />
                </div>
              )}

              {/* Active Wish Notice - uses client component to check sessionStorage */}
              {hasActiveWish && <ActiveWishBanner />}

              {/* Wish List */}
              <WishList wishes={wishes || []} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
