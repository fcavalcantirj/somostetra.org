import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Share2, Award, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CopyButton } from "@/components/copy-button"
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
    title: translations.referrals.title,
    description: translations.referrals.description,
    path: '/referrals',
    locale: validLocale,
    noIndex: true, // Protected page
  })
}

export default async function ReferralsPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations("referralsStandalone")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch referrals with referred user details
  const { data: memberReferrals } = await supabase
    .from("referrals")
    .select(
      `
      id,
      created_at,
      referred:referred_id (
        id,
        display_name,
        points,
        created_at
      )
    `,
    )
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch supporter referrals
  const { data: supporterReferrals } = await supabase
    .from("supporters")
    .select("id, name, email, created_at")
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false })

  const memberReferralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/signup?ref=${profile?.referral_code}`
  const supporterReferralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://sou.tetra"}/auth/supporter-signup?ref=${profile?.referral_code}`

  const totalMemberReferrals = memberReferrals?.length || 0
  const totalSupporterReferrals = supporterReferrals?.length || 0
  const totalPointsEarned = totalMemberReferrals * 20 + totalSupporterReferrals * 10

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
            SOU<span className="text-gradient">TETRA</span>
          </Link>
          <Button asChild variant="outline" className="glass-strong font-bold bg-transparent">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("backToDashboard")}
            </Link>
          </Button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter">
              {t("title")} <span className="text-gradient">{t("titleHighlight")}</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {t("membersReferred")}
                </span>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-6xl font-black text-gradient">{totalMemberReferrals}</p>
              <p className="text-muted-foreground">{t("membersDescription")}</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("supporters")}</span>
                <Users className="w-5 h-5 text-accent" />
              </div>
              <p className="text-6xl font-black text-gradient">{totalSupporterReferrals}</p>
              <p className="text-muted-foreground">{t("supportersDescription")}</p>
            </div>

            <div className="glass-strong p-8 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("pointsEarned")}</span>
                <Award className="w-5 h-5 text-accent" />
              </div>
              <p className="text-6xl font-black text-gradient">{totalPointsEarned}</p>
              <p className="text-muted-foreground">{t("pointsDescription")}</p>
            </div>
          </div>

          <div className="space-y-8 mb-16">
            <h2 className="text-4xl font-black">{t("yourLinks")}</h2>

            {/* Member Referral Link */}
            <div className="glass-strong p-10 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-blue-500/20 p-2">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold">{t("forTetraplegics")}</h3>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("forTetraplegicsDescription", { points: 20 })}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all">
                  {memberReferralLink}
                </div>
                <CopyButton text={memberReferralLink} linkType="member" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${t("shareMemberWhatsapp")} ${memberReferralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`mailto:?subject=${encodeURIComponent(t("shareMemberEmailSubject"))}&body=${encodeURIComponent(`${t("shareMemberEmailBody")} ${memberReferralLink}`)}`}
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </div>

            {/* Supporter Referral Link */}
            <div className="glass-strong p-10 rounded-3xl space-y-6 border-2 border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-purple-500/20 p-2">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold">{t("forSupporters")}</h3>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("forSupportersDescription", { points: 10 })}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 glass px-6 py-4 rounded-2xl font-mono text-sm break-all">
                  {supporterReferralLink}
                </div>
                <CopyButton text={supporterReferralLink} linkType="supporter" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${t("shareSupporterWhatsapp")} ${supporterReferralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass-strong font-bold h-14 bg-transparent">
                  <a
                    href={`mailto:?subject=${encodeURIComponent(t("shareSupporterEmailSubject"))}&body=${encodeURIComponent(`${t("shareSupporterEmailBody")} ${supporterReferralLink}`)}`}
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-black">{t("yourReferrals")}</h2>

            {/* Member Referrals */}
            {memberReferrals && memberReferrals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  {t("tetraplegicMembers")} ({totalMemberReferrals})
                </h3>
                {memberReferrals.map((referral: any) => {
                  const dateLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR"
                  return (
                  <div key={referral.id} className="glass-strong p-6 rounded-3xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{referral.referred?.display_name || t("member")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("joinedOn")} {new Date(referral.created_at).toLocaleDateString(dateLocale)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="gradient-accent font-bold">+20 pts</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {referral.referred?.points || 0} {t("totalPoints")}
                        </p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}

            {/* Supporter Referrals */}
            {supporterReferrals && supporterReferrals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-400" />
                  {t("supporters")} ({totalSupporterReferrals})
                </h3>
                {supporterReferrals.map((supporter) => {
                  const dateLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR"
                  return (
                  <div key={supporter.id} className="glass-strong p-6 rounded-3xl border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{supporter.name}</p>
                          <p className="text-sm text-muted-foreground">{supporter.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("supportedOn")} {new Date(supporter.created_at).toLocaleDateString(dateLocale)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400 font-bold">+10 pts</Badge>
                    </div>
                  </div>
                )})}
              </div>
            )}

            {(!memberReferrals || memberReferrals.length === 0) &&
              (!supporterReferrals || supporterReferrals.length === 0) && (
                <div className="glass-strong p-12 rounded-3xl text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl gradient-primary/20 flex items-center justify-center mx-auto">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black">{t("noReferralsYet")}</h3>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    {t("noReferralsDescription")}
                  </p>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  )
}
