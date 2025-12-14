"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface SubmitWishHelpData {
  wishId: string
  name: string
  email: string
  phone?: string
  message?: string
}

export async function submitWishHelp(data: SubmitWishHelpData): Promise<{
  success: boolean
  error?: string
}> {
  // Validate inputs
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: "Nome é obrigatório" }
  }

  if (!data.email || !data.email.includes("@")) {
    return { success: false, error: "Email inválido" }
  }

  if (!data.wishId) {
    return { success: false, error: "Desejo não encontrado" }
  }

  const supabase = await createClient()

  // Verify wish exists and is approved
  const { data: wish, error: wishError } = await supabase
    .from("wishes")
    .select("id, status")
    .eq("id", data.wishId)
    .eq("status", "approved")
    .single()

  if (wishError || !wish) {
    return { success: false, error: "Desejo não encontrado ou não está mais disponível" }
  }

  // Insert help request
  const { error } = await supabase.from("wish_help_requests").insert({
    wish_id: data.wishId,
    helper_name: data.name.trim(),
    helper_email: data.email.trim().toLowerCase(),
    helper_phone: data.phone?.trim() || null,
    message: data.message?.trim() || null,
    status: "pending",
  })

  if (error) {
    console.error("Error submitting wish help request:", error)
    return { success: false, error: "Erro ao enviar. Tente novamente." }
  }

  revalidatePath("/admin/wish-help-requests")
  return { success: true }
}
