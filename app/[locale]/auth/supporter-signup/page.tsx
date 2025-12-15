"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Heart, Users, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { trackSignup } from "@/lib/analytics"
import { useTranslations } from "next-intl"

export default function SupporterSignupPage() {
  const t = useTranslations("auth.supporterSignup")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [referrerName, setReferrerName] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref")

  console.log("[v0] Referral code from URL:", referralCode)

  useEffect(() => {
    async function fetchReferrer() {
      if (referralCode) {
        console.log("[v0] Looking up referrer with code:", referralCode)
        const supabase = createClient()
        const { data: referrer } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("referral_code", referralCode)
          .maybeSingle()

        console.log("[v0] Referrer lookup result:", referrer)
        setReferrerName(referrer?.display_name || null)
      }
    }
    fetchReferrer()
  }, [referralCode])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let referrerId = null
      if (referralCode) {
        console.log("[v0] Signup: Looking up referrer ID with code:", referralCode)
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle()

        referrerId = referrer?.id
        console.log("[v0] Signup: Referrer ID found:", referrerId)
      }

      const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost"
      const redirectUrl = isLocalhost
        ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/supporter-success`
        : process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/supporter-success`
          : `${window.location.origin}/auth/supporter-success`

      console.log("[v0] Signup metadata:", {
        user_type: "supporter",
        full_name: name,
        phone: phone || null,
        referred_by: referrerId,
      })

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: "supporter",
            full_name: name,  // FIXED: Changed from display_name to full_name to match trigger
            phone: phone || null,
            referred_by: referrerId,
          },
        },
      })

      if (signUpError) {
        console.error("[v0] SignUp Error Object:", JSON.stringify(signUpError, null, 2))
        throw signUpError
      }

      trackSignup("supporter", referralCode || undefined)

      router.push("/auth/check-email?type=supporter")
    } catch (err: unknown) {
      console.error("[v0] Error creating supporter:", err)
      console.error("[v0] Error stringified:", JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err.message : t("error"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-12 space-y-6">
          <Link href="/" className="inline-block text-3xl font-bold">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Heart className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">{t("badge")}</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black tracking-tighter">
              {t("title")} <span className="text-gradient">{t("titleHighlight")}</span>
            </h1>

            {referrerName && (
              <Alert className="glass-strong border-accent/50">
                <Users className="h-4 w-4 text-accent" />
                <AlertDescription className="text-lg">
                  {t("invitedBy", { name: referrerName })}
                </AlertDescription>
              </Alert>
            )}

            <p className="text-xl text-muted-foreground leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="glass-strong p-10 rounded-3xl space-y-8">
          <div className="grid gap-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-bold">
                {t("fullName")}
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t("fullNamePlaceholder")}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 text-lg glass"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-bold">
                {t("email")}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg glass"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-bold">
                {t("password")}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-lg glass"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-base font-bold">
                {t("phone")}
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder={t("phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 text-lg glass"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full gradient-primary font-bold h-14 text-lg"
              disabled={isLoading}
            >
              {isLoading ? t("submitting") : t("submit")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("disclaimer")}
            </p>
          </div>
        </form>

        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-accent" />
            <p className="font-bold">{t("benefit1")}</p>
            <p className="text-sm text-muted-foreground">{t("benefit1Sub")}</p>
          </div>
          <div className="glass p-6 rounded-2xl text-center space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-accent" />
            <p className="font-bold">{t("benefit2")}</p>
            <p className="text-sm text-muted-foreground">{t("benefit2Sub")}</p>
          </div>
          <div className="glass p-6 rounded-2xl text-center space-y-2">
            <Heart className="w-8 h-8 mx-auto text-accent" />
            <p className="font-bold">{t("benefit3")}</p>
            <p className="text-sm text-muted-foreground">{t("benefit3Sub")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
