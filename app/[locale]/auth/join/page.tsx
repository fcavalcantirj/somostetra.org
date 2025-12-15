"use client"

import { Button } from "@/components/ui/button"
import { Users, Heart, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { trackUserTypeSelection } from "@/lib/analytics"
import { useTranslations } from "next-intl"

export default function JoinPage() {
  const t = useTranslations("auth.join")
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref")
  const refParam = referralCode ? `?ref=${referralCode}` : ""

  const handleMemberClick = () => {
    trackUserTypeSelection("member", !!referralCode)
  }

  const handleSupporterClick = () => {
    trackUserTypeSelection("supporter", !!referralCode)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <Link href="/" className="inline-block text-3xl font-bold">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>

          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter">
            {t("title")} <span className="text-gradient">{t("titleHighlight")}</span>?
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Member Card */}
          <div className="glass-strong p-10 rounded-3xl space-y-8 hover:scale-[1.02] transition-transform">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                <Users className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black">{t("member.title")}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("member.description")}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("member.benefit1")}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("member.benefit2")}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("member.benefit3")}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("member.benefit4")}</p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full gradient-primary font-bold h-14 text-lg">
              <Link href={`/auth/signup${refParam}`} onClick={handleMemberClick}>
                {t("member.cta")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Supporter Card */}
          <div className="glass-strong p-10 rounded-3xl space-y-8 hover:scale-[1.02] transition-transform">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center">
                <Heart className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black">{t("supporter.title")}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("supporter.description")}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("supporter.benefit1")}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("supporter.benefit2")}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("supporter.benefit3")}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{t("supporter.benefit4")}</p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full gradient-accent font-bold h-14 text-lg">
              <Link href={`/auth/supporter-signup${refParam}`} onClick={handleSupporterClick}>
                {t("supporter.cta")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/auth/login" className="text-accent hover:underline font-medium">
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
