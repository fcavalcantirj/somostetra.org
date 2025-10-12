"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Check if user is admin
async function checkAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  return { supabase, user }
}

// Badge Actions
export async function createBadge(formData: FormData) {
  const { supabase } = await checkAdmin()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const icon = formData.get("icon") as string
  const pointsRequired = Number.parseInt(formData.get("points_required") as string)

  const { error } = await supabase.from("badges").insert({
    name,
    description,
    icon,
    points_required: pointsRequired,
  })

  if (error) {
    console.error("[v0] Error creating badge:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/badges")
  return { success: true }
}

export async function updateBadge(badgeId: string, formData: FormData) {
  const { supabase } = await checkAdmin()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const icon = formData.get("icon") as string
  const pointsRequired = Number.parseInt(formData.get("points_required") as string)

  const { error } = await supabase
    .from("badges")
    .update({
      name,
      description,
      icon,
      points_required: pointsRequired,
    })
    .eq("id", badgeId)

  if (error) {
    console.error("[v0] Error updating badge:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/badges")
  return { success: true }
}

export async function deleteBadge(badgeId: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("badges").delete().eq("id", badgeId)

  if (error) {
    console.error("[v0] Error deleting badge:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/badges")
  return { success: true }
}

// Vote Actions
export async function deleteVote(voteId: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("votes").delete().eq("id", voteId)

  if (error) {
    console.error("[v0] Error deleting vote:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/votes")
  return { success: true }
}

export async function updateVoteStatus(voteId: string, status: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("votes").update({ status }).eq("id", voteId)

  if (error) {
    console.error("[v0] Error updating vote status:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/votes")
  return { success: true }
}

// User Actions
export async function toggleUserAdmin(userId: string, isAdmin: boolean) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId)

  if (error) {
    console.error("[v0] Error toggling admin:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUserPoints(userId: string, points: number) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("profiles").update({ points }).eq("id", userId)

  if (error) {
    console.error("[v0] Error updating points:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("profiles").delete().eq("id", userId)

  if (error) {
    console.error("[v0] Error deleting user:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

// Badge Assignment and Removal Actions
export async function assignBadgeToUser(userId: string, badgeId: string) {
  const { supabase } = await checkAdmin()

  // Check if user already has this badge
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .single()

  if (existing) {
    return { error: "Usuário já possui esta badge" }
  }

  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
  })

  if (error) {
    console.error("[v0] Error assigning badge:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function removeBadgeFromUser(userId: string, badgeId: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId)

  if (error) {
    console.error("[v0] Error removing badge:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}
