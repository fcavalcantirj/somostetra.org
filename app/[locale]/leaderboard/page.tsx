import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, ArrowLeft, TrendingUp } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import { generatePageMetadata, seoTranslations } from "@/lib/seo"
import { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const validLocale = (locale as Locale) || 'pt'
  const translations = seoTranslations[validLocale]

  return generatePageMetadata({
    title: translations.leaderboard.title,
    description: translations.leaderboard.description,
    path: '/leaderboard',
    locale: validLocale,
  })
}

export default async function LeaderboardPage() {
  const t = await getTranslations("leaderboardPage")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: leaderboard } = await supabase
    .from("profiles")
    .select(
      `
      id,
      display_name,
      points,
      created_at,
      user_type,
      username,
      profile_public,
      member_referrals:referrals!referrer_id(count),
      supporter_referrals:supporters!referred_by(count)
    `,
    )
    .order("points", { ascending: false })
    .limit(50)

  const userRank = user ? (leaderboard?.findIndex((p) => p.id === user.id) ?? -1) : -1
  const userProfile = user ? leaderboard?.find((p) => p.id === user.id) : null
  const isUserSupporter = userProfile?.user_type === "supporter"

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Somos<span className="text-gradient">Tetra</span>
          </Link>
          {user ? (
            <Button asChild variant="outline" className="glass-strong font-bold bg-transparent">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("backToDashboard")}
              </Link>
            </Button>
          ) : (
            <Button asChild className="gradient-accent font-bold">
              <Link href="/auth/login">{t("loginToCompete")}</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              <span className="text-gradient">{t("titleHighlight")}</span> {t("title")}
            </h1>
            <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
          </div>

          {user && userRank >= 0 && (
            <div className="mb-12 glass-strong p-8 rounded-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center">
                    <span className="text-3xl font-black">{userRank + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("yourPosition")}</p>
                    <p className="text-3xl font-black">{userProfile?.display_name}</p>
                    {!isUserSupporter && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("membersReferred", {
                          members: (userProfile as any)?.member_referrals?.[0]?.count || 0,
                          supporters: (userProfile as any)?.supporter_referrals?.[0]?.count || 0
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right pr-8">
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("points")}</p>
                  <p className="text-4xl font-black text-gradient leading-none">{userProfile?.points || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {leaderboard?.map((member, index) => {
              const isCurrentUser = user && member.id === user.id
              const isTop3 = index < 3
              const memberReferrals = (member as any).member_referrals?.[0]?.count || 0
              const supporterReferrals = (member as any).supporter_referrals?.[0]?.count || 0
              const isSupporter = member.user_type === "supporter"

              return (
                <div
                  key={member.id}
                  className={`glass-strong p-6 rounded-3xl ${
                    isCurrentUser
                      ? "border-2 border-accent/30"
                      : isTop3
                        ? "border-2 border-primary/30"
                        : isSupporter
                          ? "border-2 border-blue/20"
                          : ""
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
                        <Trophy className="w-8 h-8 text-white" />
                      ) : index === 1 ? (
                        <Medal className="w-8 h-8 text-white" />
                      ) : index === 2 ? (
                        <Award className="w-8 h-8 text-white" />
                      ) : (
                        <span className="text-2xl font-black">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {member.profile_public && member.username ? (
                          <Link
                            href={`/p/${member.username}`}
                            className="text-xl font-black text-primary underline decoration-primary/40 hover:decoration-primary transition-colors"
                          >
                            {member.display_name}
                          </Link>
                        ) : (
                          <p className="text-xl font-black">{member.display_name}</p>
                        )}
                        {isCurrentUser && <Badge className="gradient-accent font-bold">{t("you")}</Badge>}
                        {isSupporter && !isCurrentUser && (
                          <Badge variant="outline" className="border-blue/30 text-blue font-bold">
                            {t("supporter")}
                          </Badge>
                        )}
                        {isTop3 && !isCurrentUser && !isSupporter && (
                          <Badge className="gradient-primary font-bold">{t("top3")}</Badge>
                        )}
                      </div>
                      {!isSupporter && (
                        <p className="text-sm text-muted-foreground">
                          {t("membersReferred", { members: memberReferrals, supporters: supporterReferrals })}
                        </p>
                      )}
                    </div>

                    <div className="text-right pr-6">
                      <p className="text-4xl font-black text-gradient leading-none">{member.points}</p>
                      <p className="text-sm text-muted-foreground font-bold mt-1">{t("pointsLabel")}</p>
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
