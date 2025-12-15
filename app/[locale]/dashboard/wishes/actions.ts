"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

// Create a new wish
export async function createWish(content: string): Promise<{
  success: boolean
  error?: string
}> {
  const t = await getTranslations("wishValidation")
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: t("notAuthenticated") }
  }

  // Check if profile is completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .single()

  if (!profile?.profile_completed) {
    return { success: false, error: t("completeProfile") }
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    return { success: false, error: t("describeNeed") }
  }

  if (content.length > 1000) {
    return { success: false, error: t("maxCharacters") }
  }

  // Check if user already has an active wish
  const { data: existingWish } = await supabase
    .from("wishes")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle()

  if (existingWish) {
    return { success: false, error: t("activeWishExists") }
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
      return { success: false, error: t("duplicateWish") }
    }
    return { success: false, error: t("createError") }
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
  const t = await getTranslations("wishValidation")
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: t("notAuthenticated") }
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    return { success: false, error: t("describeNeed") }
  }

  if (content.length > 1000) {
    return { success: false, error: t("maxCharacters") }
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
    return { success: false, error: t("updateError") }
  }

  revalidatePath("/dashboard/wishes")
  return { success: true }
}

// Delete a pending wish
export async function deleteWish(wishId: string): Promise<{
  success: boolean
  error?: string
}> {
  const t = await getTranslations("wishValidation")
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: t("notAuthenticated") }
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
    return { success: false, error: t("deleteError") }
  }

  revalidatePath("/dashboard/wishes")
  return { success: true }
}

// Get user's wishes
export async function getUserWishes() {
  const t = await getTranslations("wishValidation")
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { wishes: [], error: t("notAuthenticated") }
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
    return { wishes: [], error: t("fetchError") }
  }

  return { wishes: wishes || [], error: null }
}
