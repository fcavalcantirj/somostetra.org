"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { trackSignup } from "@/lib/analytics"
import { useTranslations } from "next-intl"

export default function SignupPage() {
  const t = useTranslations("auth.signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [referrerName, setReferrerName] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref")

  console.log("[v0] Member signup - Referral code from URL:", referralCode)

  useEffect(() => {
    const fetchReferrerName = async () => {
      if (!referralCode) return

      console.log("[v0] Member signup - Looking up referrer with code:", referralCode)
      const supabase = createClient()
      const { data: referrer } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("referral_code", referralCode)
        .maybeSingle()

      console.log("[v0] Member signup - Referrer lookup result:", referrer)
      if (referrer?.display_name) {
        setReferrerName(referrer.display_name)
      }
    }

    fetchReferrerName()
  }, [referralCode])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      let referrerId = null
      if (referralCode) {
        console.log("[v0] Member signup - Looking up referrer ID with code:", referralCode)
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle()

        referrerId = referrer?.id
        console.log("[v0] Member signup - Referrer ID found:", referrerId)
      }

      const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost"
      const redirectUrl = isLocalhost
        ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`
        : process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
          : `${window.location.origin}/dashboard`

      console.log("[v0] Member signup metadata:", {
        user_type: "member",
        full_name: displayName,
        referred_by: referrerId,
      })

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: "member",
            full_name: displayName,
            referred_by: referrerId,
          },
        },
      })

      if (error) throw error

      trackSignup("member", referralCode || undefined)

      router.push("/auth/check-email")
    } catch (error: unknown) {
      console.error("[v0] Member signup - Error creating account:", error)
      setError(error instanceof Error ? error.message : t("error"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 rounded-3xl">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground mb-6">{t("subtitle")}</p>

          {referralCode && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                🎉 {t("invitedBy", { name: referrerName || "" })}
              </p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="displayName">{t("displayName")}</Label>
              <Input
                id="displayName"
                type="text"
                placeholder={t("displayNamePlaceholder")}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              disabled={isLoading}
            >
              {isLoading ? t("submitting") : t("submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
