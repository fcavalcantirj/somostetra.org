import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, TrendingUp, Share2, Sparkles, Trophy, Award, Microscope, ArrowRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { CopyButton } from "@/components/copy-button"
import { trackDashboardView } from "@/lib/analytics"
import { BadgeProgressBar } from "@/components/badge-progress-bar"
import { getTranslations } from "next-intl/server"

// Supporter dashboard should not be indexed by search engines
export const metadata: Metadata = {
  title: "Supporter Dashboard",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default async function SupporterDashboardPage() {
  const t = await getTranslations("supporterDashboard")
  const tCommon = await getTranslations("common")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch supporter profile
  const { data: supporter } = await supabase.from("supporters").select("*").eq("auth_user_id", user.id).single()

  if (!supporter) {
    // Not a supporter, redirect to regular dashboard
    redirect("/dashboard")
  }

  // Fetch supporter's profile - must exist since supporter record exists
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch referrer info if exists
  let referrerInfo = null
  if (supporter.referred_by) {
    const { data: referrer } = await supabase
      .from("profiles")
      .select("display_name, referral_code, username, profile_public")
      .eq("id", supporter.referred_by)
      .single()
    referrerInfo = referrer
  }

  const { data: activeVotes } = await supabase
    .from("votes")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const { count: votesCount } = await supabase
    .from("user_votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch total members count
  const { count: membersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  // Fetch total supporters count
  const { count: supportersCount } = await supabase.from("supporters").select("*", { count: "exact", head: true })

  // Fetch supporter's own referrals (supporters they invited)
  const { data: myReferrals } = await supabase
    .from("supporters")
    .select("id, name, created_at")
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false })

  // FIXED: Use supporter's OWN referral code, not their referrer's code!
  const supporterLink = profile?.referral_code
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup?ref=${profile.referral_code}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup`

  const myReferralsCount = myReferrals?.length || 0
  const pointsFromReferrals = myReferralsCount * 10

  // Fetch all available badges for progress calculation
  const { data: allBadges } = await supabase
    .from("badges")
    .select("name, icon, points_required")
    .order("points_required", { ascending: true })

  return (
    <div className="min-h-screen relative overflow-hidden">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              ${trackDashboardView.toString()}
              trackDashboardView('supporter');
            }
          `,
        }}
      />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex items-center justify-between max-w-full">
          <Link href="/supporter-dashboard" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/clinical-trials" className="hover:opacity-80 transition-opacity" title={tCommon("clinicalTrials")}>
              <Microscope className="w-6 h-6 text-primary" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Heart className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">{t("badge")}</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              {t("greeting", { name: "" })} <span className="text-gradient">{supporter.name}</span>
            </h1>
            <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* Clinical Trials CTA */}
          <div className="mb-12">
            <Link href="/dashboard/clinical-trials" className="block">
              <div className="glass-strong p-6 sm:p-8 rounded-3xl border-2 border-primary/50 hover:border-primary transition-colors hover:scale-[1.01] transition-transform">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <Microscope className="w-8 h-8" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl sm:text-2xl font-black">{t("clinicalTrials.title")}</h3>
                      <Badge className="gradient-accent font-bold">{t("clinicalTrials.newBadge")}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {t("clinicalTrials.description")}
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-primary hidden sm:block" />
                </div>
              </div>
            </Link>
          </div>

          {/* Impact Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("stats.members")}</span>
                <Badge className="gradient-primary font-bold">{t("stats.tetraplegic")}</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{membersCount || 0}</p>
              <p className="text-muted-foreground">{t("stats.inCommunity")}</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("stats.supporters")}</span>
                <Badge className="gradient-accent font-bold">{t("stats.likeYou")}</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{supportersCount || 0}</p>
              <p className="text-muted-foreground">{t("stats.engaged")}</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("stats.votes")}</span>
                <Badge className="gradient-accent font-bold">{t("stats.activeLabel")}</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{activeVotes?.length || 0}</p>
              <p className="text-muted-foreground">
                {votesCount !== null && votesCount > 0 ? t("stats.youVoted", { count: votesCount }) : t("stats.participateNow")}
              </p>
            </div>
          </div>

          {/* How to Earn Points Section - High Priority */}
          {profile && allBadges && allBadges.length > 0 && (
            <div className="mb-16">
              <h2 className="text-4xl font-black mb-6">{t("progress.title")}</h2>
              <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{t("progress.yourProgress")}</h3>
                    <p className="text-muted-foreground">{t("progress.recognized")}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass p-6 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.voting")}</span>
                      <Badge className="gradient-accent font-bold">+5 pts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("progress.votingDescription")}</p>
                  </div>

                  <div className="glass p-6 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.referrals")}</span>
                      <Badge className="gradient-accent font-bold">+10 pts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("progress.referralsDescription")}</p>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border-2 border-accent/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.yourPoints")}</p>
                      <p className="text-4xl font-black text-gradient">{profile.points || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.yourReferrals")}</p>
                      <p className="text-4xl font-black text-gradient">{myReferralsCount}</p>
                    </div>
                  </div>
                  {myReferralsCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("progress.earnedFromReferrals", { points: pointsFromReferrals })}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="pt-4 border-t border-border/50">
                    <BadgeProgressBar currentPoints={profile.points || 0} badges={allBadges} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Votes Section */}
          {activeVotes && activeVotes.length > 0 && (
            <div className="space-y-6 mb-16">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black">{t("activeVotes.title")}</h2>
                <Button variant="ghost" className="font-bold uppercase tracking-wider" asChild>
                  <Link href="/votes">{t("activeVotes.viewAll")} →</Link>
                </Button>
              </div>

              <div className="space-y-6">
                {activeVotes.map((vote) => (
                  <div
                    key={vote.id}
                    className="glass-strong p-8 rounded-3xl space-y-6 hover:scale-[1.01] transition-transform"
                  >
                    <div className="space-y-4">
                      <Badge className="gradient-accent font-bold">{t("activeVotes.active")}</Badge>
                      <h3 className="text-2xl lg:text-3xl font-black leading-tight">{vote.title}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">{vote.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground font-bold">
                        <Users className="w-4 h-4 inline mr-1" />
                        {t("activeVotes.votes", { count: vote.vote_count })}
                      </p>
                      <Button size="lg" className="gradient-primary font-bold h-12 px-8" asChild>
                        <Link href={`/votes/${vote.id}`}>{t("activeVotes.voteNow")}</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referrer Info */}
          {referrerInfo && (
            <div className="glass-strong p-10 rounded-3xl mb-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t("referrer.title")}</h3>
                  {referrerInfo.profile_public && referrerInfo.username ? (
                    <Link
                      href={`/p/${referrerInfo.username}`}
                      className="text-2xl font-black text-gradient underline decoration-primary/40 hover:decoration-primary transition-all hover:opacity-90"
                    >
                      {referrerInfo.display_name}
                    </Link>
                  ) : (
                    <p className="text-2xl font-black text-gradient">{referrerInfo.display_name}</p>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">
                {t("referrer.description")}
              </p>
            </div>
          )}

          {/* Call to Action */}
          <div className="space-y-8">
            <h2 className="text-4xl font-black">{t("progress.title")}</h2>

            {/* How to Earn Points Section */}
            {profile && (
              <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{t("progress.yourProgress")}</h3>
                    <p className="text-muted-foreground">{t("progress.recognized")}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass p-6 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.voting")}</span>
                      <Badge className="gradient-accent font-bold">+5 pts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("progress.votingDescription")}</p>
                  </div>

                  <div className="glass p-6 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.referrals")}</span>
                      <Badge className="gradient-accent font-bold">+10 pts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("progress.referralsDescription")}</p>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border-2 border-accent/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.yourPoints")}</p>
                      <p className="text-4xl font-black text-gradient">{profile.points || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("progress.yourReferrals")}</p>
                      <p className="text-4xl font-black text-gradient">{myReferralsCount}</p>
                    </div>
                  </div>
                  {myReferralsCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("progress.earnedFromReferrals", { points: pointsFromReferrals })}
                    </p>
                  )}

                  {/* Progress Bar */}
                  {allBadges && allBadges.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <BadgeProgressBar currentPoints={profile.points || 0} badges={allBadges} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{t("share.title")}</h3>
                  <p className="text-muted-foreground">{t("share.earnPoints")}</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("share.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all overflow-hidden">
                  {supporterLink}
                </div>
                <CopyButton text={supporterLink} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(t("share.whatsappMessage", { link: supporterLink }))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`mailto:?subject=${encodeURIComponent(t("share.emailSubject"))}&body=${encodeURIComponent(t("share.emailBody", { link: supporterLink }))}`}
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-strong p-8 rounded-3xl space-y-4">
                <Sparkles className="w-10 h-10 text-accent" />
                <h3 className="text-xl font-bold">{t("roleEssential.title")}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("roleEssential.description")}
                </p>
              </div>

              <div className="glass-strong p-8 rounded-3xl space-y-4">
                <TrendingUp className="w-10 h-10 text-accent" />
                <h3 className="text-xl font-bold">{t("trackProgress.title")}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t("trackProgress.description")}
                </p>
              </div>
            </div>

            {/* Leaderboard Link */}
            <div className="glass-strong p-10 rounded-3xl border-2 border-primary/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{t("ranking.title")}</h3>
                  <p className="text-muted-foreground">{t("ranking.subtitle")}</p>
                </div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("ranking.description")}
              </p>
              <Button asChild size="lg" className="gradient-primary font-bold h-14 w-full sm:w-auto">
                <Link href="/leaderboard">
                  {t("ranking.viewFull")}
                  <Trophy className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
