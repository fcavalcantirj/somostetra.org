import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WishCategoriesClient } from "./wish-categories-client"

export default async function AdminWishCategories() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  // Fetch all wish categories
  const { data: categories } = await supabase
    .from("wish_categories")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Categorias de Desejos</h1>
              <p className="text-sm text-white/60">{categories?.length || 0} categorias cadastradas</p>
            </div>
          </div>
        </div>
      </div>
      <WishCategoriesClient categories={categories || []} />
    </div>
  )
}
