import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Share2, TrendingUp, Sparkles, Plus, Heart, UserCircle, ArrowRight, Star, Microscope } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { CopyButton } from "@/components/copy-button"
import { trackDashboardView } from "@/lib/analytics"
import { BadgeProgressBar } from "@/components/badge-progress-bar"
import { getTranslations } from "next-intl/server"

// Dashboard pages should not be indexed by search engines
export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: supporter } = await supabase.from("supporters").select("*").eq("auth_user_id", user.id).maybeSingle()

  if (supporter) {
    redirect("/supporter-dashboard")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch member referrals count
  const { count: memberReferralCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", user.id)

  // Fetch supporter referrals count
  const { count: supporterReferralCount } = await supabase
    .from("supporters")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", user.id)

  // Total referrals = members + supporters
  const referralCount = (memberReferralCount || 0) + (supporterReferralCount || 0)

  // Fetch user votes count
  const { count: votesCount } = await supabase
    .from("user_votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch active votes
  const { data: activeVotes } = await supabase
    .from("votes")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(2)

  // Fetch user badges
  const { data: userBadges } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id).limit(3)

  // Fetch all available badges for progress calculation
  const { data: allBadges } = await supabase
    .from("badges")
    .select("name, icon, points_required")
    .order("points_required", { ascending: true })

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id, display_name, points, username, profile_public")
    .order("points", { ascending: false })
    .limit(10)

  const { count: supporterCount } = await supabase
    .from("supporters")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", user.id)

  const userRank = leaderboard?.findIndex((p) => p.id === user.id) ?? -1
  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/signup?ref=${profile?.referral_code}`
  const supporterLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup?ref=${profile?.referral_code}`
  const isAdmin = profile?.is_admin === true

  return (
    <div className="min-h-screen relative overflow-hidden">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              ${trackDashboardView.toString()}
              trackDashboardView('member');
            }
          `,
        }}
      />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex items-center justify-between max-w-full">
          <Link href="/dashboard" className="text-xl sm:text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard/clinical-trials" className="hover:opacity-80 transition-opacity" title={t("clinicalTrials.title")}>
              <Microscope className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </Link>
            <Link href="/dashboard/wishes" className="hover:opacity-80 transition-opacity" title={t("wishes.title")}>
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </Link>
            <Link href="/dashboard/profile" className="hover:opacity-80 transition-opacity" title={t("completeProfile.title")}>
              <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">{t("badge")}</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              {t("greeting", { name: "" })} <span className="text-gradient">{profile?.display_name || t("defaultName")}</span>
            </h1>
            <p className="text-xl text-muted-foreground">{t("welcome")}</p>
          </div>

          {/* Complete Profile CTA */}
          {!profile?.profile_completed && (
            <div className="mb-12">
              <Link href="/dashboard/profile" className="block">
                <div className="glass-strong p-6 sm:p-8 rounded-3xl border-2 border-accent/50 hover:border-accent transition-colors hover:scale-[1.01] transition-transform">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-8 h-8" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl sm:text-2xl font-black">{t("completeProfile.title")}</h3>
                        <Badge className="gradient-primary font-bold">{t("completeProfile.points")}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {t("completeProfile.description")}
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-accent hidden sm:block" />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Wishes CTA - Only show if profile is completed */}
          {profile?.profile_completed && (
            <div className="mb-12">
              <Link href="/dashboard/wishes" className="block">
                <div className="glass-strong p-6 sm:p-8 rounded-3xl border-2 border-primary/50 hover:border-primary transition-colors hover:scale-[1.01] transition-transform">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Star className="w-8 h-8" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl sm:text-2xl font-black">{t("wishes.title")}</h3>
                        <Badge className="gradient-accent font-bold">{t("wishes.badge")}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {t("wishes.description")}
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary hidden sm:block" />
                  </div>
                </div>
              </Link>
            </div>
          )}

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
                      <Badge className="gradient-accent font-bold">{t("clinicalTrials.badge")}</Badge>
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

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Link
              href="/dashboard/referrals"
              className="glass-strong p-8 rounded-3xl space-y-4 hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("stats.referrals")}</span>
                {referralCount && referralCount > 0 && (
                  <Badge className="gradient-accent font-bold">+{referralCount}</Badge>
                )}
              </div>
              <p className="text-6xl font-black text-gradient">{referralCount || 0}</p>
              <div className="space-y-1">
                <p className="text-muted-foreground">{t("stats.referralsDescription")}</p>
                {(memberReferralCount || supporterReferralCount) && (
                  <p className="text-sm font-bold text-accent">
                    {t("stats.referralsBreakdown", { members: memberReferralCount || 0, supporters: supporterReferralCount || 0 })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{t("stats.clickDetails")} →</p>
              </div>
            </Link>

            <div className="glass-strong p-8 rounded-3xl space-y-4 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("stats.points")}</span>
                {userRank >= 0 && userRank < 10 && (
                  <Badge className="gradient-primary font-bold">{t("stats.topPercent", { percent: ((userRank + 1) / 10) * 100 })}</Badge>
                )}
              </div>
              <p className="text-6xl font-black text-gradient">{profile?.points || 0}</p>
              <p className="text-muted-foreground">{t("stats.pointsTotal")}</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("stats.votes")}</span>
                <Badge className="gradient-accent font-bold">{t("stats.votesActive", { count: activeVotes?.length || 0 })}</Badge>
              </div>
              <p className="text-6xl font-black text-gradient">{votesCount || 0}</p>
              <p className="text-muted-foreground">{t("stats.votesTotal")}</p>
            </div>
          </div>

          {/* Progress Section - High Priority */}
          {allBadges && allBadges.length > 0 && (
            <div className="mb-16">
              <h2 className="text-4xl font-black mb-6">{t("progress.title")}</h2>
              <div className="glass-strong p-8 rounded-3xl">
                <BadgeProgressBar currentPoints={profile?.points || 0} badges={allBadges} />
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Member Referral */}
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl font-black break-words">{t("referralLinks.title")}</h2>

                {/* Member Referral */}
                <div className="glass-strong p-6 sm:p-10 rounded-3xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("referralLinks.members.title")}</h3>
                      <p className="text-sm text-muted-foreground">{t("referralLinks.members.subtitle")}</p>
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t.rich("referralLinks.members.description", { points: 20 })}
                  </p>

                  {memberReferralCount !== null && memberReferralCount > 0 && (
                    <Link href="/dashboard/referrals" className="block">
                      <div className="glass px-6 py-4 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer">
                        <p className="text-center">
                          <span className="text-3xl font-black text-gradient">{memberReferralCount}</span>
                          <span className="text-muted-foreground ml-2">{t("referralLinks.members.count", { count: memberReferralCount })}</span>
                        </p>
                        <p className="text-xs text-center text-muted-foreground mt-2">{t("referralLinks.members.clickToSee")} →</p>
                      </div>
                    </Link>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 glass px-4 sm:px-6 py-4 rounded-2xl font-mono text-xs sm:text-sm break-all overflow-hidden">
                      {referralLink}
                    </div>
                    <CopyButton text={referralLink} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${t("referralLinks.shareMessageMember")} ${referralLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        {t("referralLinks.shareWhatsapp")}
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                      <a
                        href={`mailto:?subject=${t("referralLinks.emailSubjectMember")}&body=${encodeURIComponent(`${t("referralLinks.emailBodyMember")} ${referralLink}`)}`}
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        {t("referralLinks.shareEmail")}
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Supporter Referral */}
                <div className="glass-strong p-6 sm:p-10 rounded-3xl space-y-6 border-2 border-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t("referralLinks.supporters.title")}</h3>
                      <p className="text-sm text-muted-foreground">{t("referralLinks.supporters.subtitle")}</p>
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t.rich("referralLinks.supporters.description", { points: 10 })}
                  </p>

                  {supporterCount && supporterCount > 0 && (
                    <Link href="/dashboard/referrals" className="block">
                      <div className="glass px-6 py-4 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer">
                        <p className="text-center">
                          <span className="text-3xl font-black text-gradient">{supporterCount}</span>
                          <span className="text-muted-foreground ml-2">{t("referralLinks.supporters.count", { count: supporterCount })}</span>
                        </p>
                        <p className="text-xs text-center text-muted-foreground mt-2">{t("referralLinks.members.clickToSee")} →</p>
                      </div>
                    </Link>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 glass px-4 sm:px-6 py-4 rounded-2xl font-mono text-xs sm:text-sm break-all overflow-hidden">
                      {supporterLink}
                    </div>
                    <CopyButton text={supporterLink} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${t("referralLinks.shareMessageSupporter")} ${supporterLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        {t("referralLinks.shareWhatsapp")}
                      </a>
                    </Button>
                    <Button variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent" asChild>
                      <a
                        href={`mailto:?subject=${t("referralLinks.emailSubjectSupporter")}&body=${encodeURIComponent(`${t("referralLinks.emailBodySupporter")} ${supporterLink}`)}`}
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        {t("referralLinks.shareEmail")}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <h2 className="text-3xl sm:text-4xl font-black">{t("activeVotes.title")}</h2>
                  <div className="flex gap-3 flex-wrap">
                    {isAdmin && (
                      <Button className="gradient-primary font-bold" asChild>
                        <Link href="/votes/create">
                          <Plus className="w-4 h-4 mr-2" />
                          {t("activeVotes.create")}
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="font-bold uppercase tracking-wider whitespace-nowrap" asChild>
                      <Link href="/votes">{t("activeVotes.viewAll")} →</Link>
                    </Button>
                  </div>
                </div>

                {activeVotes && activeVotes.length > 0 ? (
                  <div className="space-y-6">
                    {activeVotes.map((vote) => (
                      <div
                        key={vote.id}
                        className="glass-strong p-8 rounded-3xl space-y-6 hover:scale-[1.01] transition-transform"
                      >
                        <div className="space-y-4">
                          <Badge className="gradient-accent font-bold">{t("activeVotes.statusActive")}</Badge>
                          <h3 className="text-2xl lg:text-3xl font-black leading-tight">{vote.title}</h3>
                          <p className="text-lg text-muted-foreground leading-relaxed">{vote.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <p className="text-sm text-muted-foreground font-bold">
                            <Users className="w-4 h-4 inline mr-1" />
                            {t("activeVotes.voteCount", { count: vote.vote_count })}
                          </p>
                          <Button size="lg" className="gradient-primary font-bold h-12 px-8" asChild>
                            <Link href={`/votes/${vote.id}`}>{t("activeVotes.voteNow")}</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-strong p-12 rounded-3xl text-center">
                    <p className="text-lg text-muted-foreground">{t("activeVotes.empty")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-black">{t("achievements.title")}</h3>
                <div className="glass-strong p-8 rounded-3xl">
                  {userBadges && userBadges.length > 0 ? (
                    <div className="grid grid-cols-3 gap-6">
                      {userBadges.map((ub) => (
                        <div key={ub.id} className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl">
                            {ub.badges?.icon}
                          </div>
                          <span className="text-xs text-center font-bold">{ub.badges?.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">{t("achievements.empty")}</p>
                  )}
                </div>
                <Button variant="outline" className="w-full glass-strong font-bold h-12 bg-transparent" asChild>
                  <Link href="/badges">{t("achievements.viewAll")}</Link>
                </Button>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-black">{t("ranking.title")}</h3>
                <div className="glass-strong p-6 rounded-3xl space-y-4">
                  {leaderboard && leaderboard.length > 0 ? (
                    <>
                      {leaderboard.slice(0, 3).map((member, index) => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl ${
                            index === 0 ? "gradient-primary" : "glass"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl ${index === 0 ? "bg-background/20" : "bg-muted-foreground/20"} flex items-center justify-center font-black text-lg ${index === 0 ? "text-white" : ""}`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            {member.profile_public && member.username ? (
                              <Link
                                href={`/p/${member.username}`}
                                className={`font-bold underline decoration-primary/40 hover:decoration-primary transition-colors ${index === 0 ? "text-white decoration-white/40 hover:decoration-white" : "text-primary"}`}
                              >
                                {member.display_name}
                              </Link>
                            ) : (
                              <p className={`font-bold ${index === 0 ? "text-white" : ""}`}>{member.display_name}</p>
                            )}
                            <p className={`text-sm ${index === 0 ? "text-white/80" : "text-muted-foreground"}`}>
                              {t("ranking.points", { count: member.points })}
                            </p>
                          </div>
                          {index === 0 && <Trophy className="w-5 h-5 text-white" />}
                        </div>
                      ))}

                      {userRank >= 3 && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl gradient-accent">
                          <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center font-black text-lg">
                            {userRank + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{t("ranking.you")}</p>
                            <p className="text-sm opacity-80">{t("ranking.points", { count: profile?.points })}</p>
                          </div>
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground">{t("ranking.empty")}</p>
                  )}
                </div>
                <Button variant="outline" className="w-full glass-strong font-bold h-12 bg-transparent" asChild>
                  <Link href="/leaderboard">{t("ranking.viewFull")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
