"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { trackLogout } from "@/lib/analytics"
import { useTranslations } from "next-intl"

export function LogoutButton() {
  const t = useTranslations("common")
  const router = useRouter()

  const handleLogout = async () => {
    trackLogout()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button onClick={handleLogout} variant="outline" className="glass-strong font-bold bg-transparent px-2 sm:px-4" size="sm">
      <LogOut className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t("logout")}</span>
    </Button>
  )
}
