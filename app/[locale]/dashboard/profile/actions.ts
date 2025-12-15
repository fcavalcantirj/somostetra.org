"use server"

import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ProfileFormData } from "./types"
import { getTranslations } from "next-intl/server"

// Check if username is available
export async function checkUsernameAvailability(username: string, currentUserId: string): Promise<{
  available: boolean
  message?: string
}> {
  const t = await getTranslations("validation")

  if (!username) {
    return { available: false, message: t("usernameRequired") }
  }

  // Validate format: lowercase alphanumeric and underscore only
  const usernameRegex = /^[a-z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return { available: false, message: t("usernameFormat") }
  }

  if (username.length > 100) {
    return { available: false, message: t("usernameMaxLength") }
  }

  if (username.length < 3) {
    return { available: false, message: t("usernameMinLength") }
  }

  // Reserved usernames (system routes)
  const reserved = ["admin", "dashboard", "auth", "api", "p", "votes", "leaderboard", "badges", "referrals", "supporter"]
  if (reserved.includes(username)) {
    return { available: false, message: t("usernameReserved") }
  }

  const supabase = await createClient()

  // Check if username is taken by another user
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", currentUserId)
    .maybeSingle()

  if (existing) {
    return { available: false, message: t("usernameTaken") }
  }

  return { available: true }
}

// Generate username suggestion from display name
export async function suggestUsername(displayName: string, userId: string): Promise<string> {
  // Convert to lowercase, remove accents, replace spaces with underscore
  let suggestion = displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with underscore
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .slice(0, 50) // Limit length

  // Check if available
  const { available } = await checkUsernameAvailability(suggestion, userId)
  if (available) return suggestion

  // Try with numbers
  for (let i = 1; i <= 99; i++) {
    const numbered = `${suggestion}${i}`
    const check = await checkUsernameAvailability(numbered, userId)
    if (check.available) return numbered
  }

  // Fallback to random suffix
  const random = Math.random().toString(36).substring(2, 6)
  return `${suggestion}_${random}`
}

// Save profile data
export async function saveProfile(formData: ProfileFormData): Promise<{
  success: boolean
  error?: string
  pointsAwarded?: number
}> {
  const t = await getTranslations("validation")
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: t("notAuthenticated") }
  }

  // Validate username
  if (formData.username) {
    const usernameCheck = await checkUsernameAvailability(formData.username, user.id)
    if (!usernameCheck.available) {
      return { success: false, error: usernameCheck.message }
    }
  }

  // Validate CEP format if provided
  if (formData.cep && !/^\d{5}-?\d{3}$/.test(formData.cep)) {
    return { success: false, error: t("invalidCep") }
  }

  // Get current profile to check if this is first completion
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("profile_completed, points")
    .eq("id", user.id)
    .single()

  const isFirstCompletion = !currentProfile?.profile_completed

  // Determine if profile is now complete (required fields filled)
  const isComplete = Boolean(
    formData.username &&
    formData.phone &&
    formData.city &&
    formData.state &&
    formData.cep
  )

  // Build update data
  const updateData: Record<string, unknown> = {
    username: formData.username || null,
    phone: formData.phone || null,
    gender: formData.gender || null,
    preferred_communication: formData.preferred_communication || null,
    city: formData.city || null,
    state: formData.state || null,
    cep: formData.cep || null,
    date_of_birth: formData.date_of_birth || null,
    injury_date: formData.injury_date || null,
    injury_acquired: formData.injury_acquired,
    asia_scale: formData.asia_scale || null,
    asia_recent_evaluation: formData.asia_recent_evaluation,
    injury_level: formData.injury_level || null,
    pix_key: formData.pix_key || null,
    profile_picture_url: formData.profile_picture_url || null,
    profile_public: formData.profile_public,
    bio: formData.bio || null,
    bio_public: formData.bio_public,
    profile_completed: isComplete,
    updated_at: new Date().toISOString(),
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)

  if (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: t("profileSaveError") }
  }

  // Award 50 points if first completion
  let pointsAwarded = 0
  if (isFirstCompletion && isComplete) {
    const serviceClient = createServiceRoleClient()

    // Update points
    await serviceClient
      .from("profiles")
      .update({ points: (currentProfile?.points || 0) + 50 })
      .eq("id", user.id)

    // Log activity
    await serviceClient
      .from("activities")
      .insert({
        user_id: user.id,
        activity_type: "profile_completed",
        points: 50,
        description: t("profileCompleted")
      })

    pointsAwarded = 50
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard")

  return { success: true, pointsAwarded }
}
