"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Create a new wish
export async function createWish(content: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Check if profile is completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .single()

  if (!profile?.profile_completed) {
    return { success: false, error: "Complete seu perfil para criar desejos" }
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    return { success: false, error: "Descreva o que você precisa" }
  }

  if (content.length > 1000) {
    return { success: false, error: "Máximo 1000 caracteres" }
  }

  // Check if user already has an active wish
  const { data: existingWish } = await supabase
    .from("wishes")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle()

  if (existingWish) {
    return { success: false, error: "Você já possui um desejo ativo. Aguarde a conclusão ou rejeição para criar outro." }
  }

  // Create the wish
  const { error } = await supabase.from("wishes").insert({
    user_id: user.id,
    content: content.trim(),
    status: "pending",
  })

  if (error) {
    console.error("Error creating wish:", error)
    // Check for unique constraint violation
    if (error.code === "23505") {
      return { success: false, error: "Você já possui um desejo ativo ou este conteúdo já foi enviado." }
    }
    return { success: false, error: "Erro ao criar desejo" }
  }

  revalidatePath("/dashboard/wishes")
  revalidatePath("/")
  return { success: true }
}

// Update a pending wish
export async function updateWish(wishId: string, content: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    return { success: false, error: "Descreva o que você precisa" }
  }

  if (content.length > 1000) {
    return { success: false, error: "Máximo 1000 caracteres" }
  }

  // Update only own pending wishes
  const { error } = await supabase
    .from("wishes")
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", wishId)
    .eq("user_id", user.id)
    .eq("status", "pending")

  if (error) {
    console.error("Error updating wish:", error)
    return { success: false, error: "Erro ao atualizar desejo" }
  }

  revalidatePath("/dashboard/wishes")
  return { success: true }
}

// Delete a pending wish
export async function deleteWish(wishId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  // Delete only own pending wishes
  const { error } = await supabase
    .from("wishes")
    .delete()
    .eq("id", wishId)
    .eq("user_id", user.id)
    .eq("status", "pending")

  if (error) {
    console.error("Error deleting wish:", error)
    return { success: false, error: "Erro ao deletar desejo" }
  }

  revalidatePath("/dashboard/wishes")
  return { success: true }
}

// Get user's wishes
export async function getUserWishes() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { wishes: [], error: "Não autenticado" }
  }

  const { data: wishes, error } = await supabase
    .from("wishes")
    .select(`
      *,
      wish_categories (
        id,
        name,
        icon
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching wishes:", error)
    return { wishes: [], error: "Erro ao buscar desejos" }
  }

  return { wishes: wishes || [], error: null }
}
