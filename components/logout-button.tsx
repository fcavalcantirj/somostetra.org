"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button onClick={handleLogout} variant="outline" className="glass-strong font-bold bg-transparent">
      <LogOut className="w-4 h-4 mr-2" />
      Sair
    </Button>
  )
}
