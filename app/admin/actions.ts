"use server"

import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server"
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

  revalidatePath("/admin/members")
  return { success: true }
}

export async function updateUserPoints(userId: string, points: number) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("profiles").update({ points }).eq("id", userId)

  if (error) {
    console.error("[v0] Error updating points:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/members")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("profiles").delete().eq("id", userId)

  if (error) {
    console.error("[v0] Error deleting user:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/members")
  return { success: true }
}

export async function convertSupporterToMember(supporterId: string) {
  const { supabase } = await checkAdmin()

  console.log("[v0] Converting supporter to member:", supporterId)

  // Get supporter data
  const { data: supporter, error: fetchError } = await supabase
    .from("supporters")
    .select("*")
    .eq("id", supporterId)
    .single()

  if (fetchError || !supporter) {
    console.error("[v0] Error fetching supporter:", fetchError)
    return { error: "Apoiador não encontrado" }
  }

  console.log("[v0] Supporter data:", supporter)

  // Check if supporter has an auth user
  if (!supporter.auth_user_id) {
    return { error: "Apoiador não possui conta de autenticação. Não é possível converter." }
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", supporter.auth_user_id)
    .maybeSingle()

  if (existingProfile) {
    return { error: "Este apoiador já possui um perfil de membro" }
  }

  const serviceRoleClient = createServiceRoleClient()

  const { data: referralCode, error: codeError } = await serviceRoleClient.rpc("generate_referral_code")

  if (codeError || !referralCode) {
    console.error("[v0] Error generating referral code:", codeError)
    return { error: "Erro ao gerar código de indicação" }
  }

  console.log("[v0] Generated referral code:", referralCode)

  const { error: profileError } = await serviceRoleClient.from("profiles").insert({
    id: supporter.auth_user_id,
    display_name: supporter.name,
    user_type: "member",
    referred_by: supporter.referred_by,
    referral_code: referralCode,
    points: 10, // Initial member points
    created_at: supporter.created_at, // Preserve original signup date
  })

  if (profileError) {
    console.error("[v0] Error creating profile:", profileError)
    return { error: `Erro ao criar perfil: ${profileError.message}` }
  }

  console.log("[v0] Profile created successfully")

  const { error: badgeError } = await serviceRoleClient.rpc("check_and_award_badges", {
    p_user_id: supporter.auth_user_id,
  })

  if (badgeError) {
    console.error("[v0] Error assigning badges:", badgeError)
    // Don't fail the conversion if badge assignment fails
  } else {
    console.log("[v0] Badges checked and assigned")
  }

  // Update referrer points if they were referred
  if (supporter.referred_by) {
    const { error: pointsError } = await serviceRoleClient.rpc("increment_user_points", {
      user_id: supporter.referred_by,
      points_to_add: 10, // Member referral points
    })

    if (pointsError) {
      console.error("[v0] Error updating referrer points:", pointsError)
      // Don't fail the conversion if points update fails
    } else {
      console.log("[v0] Referrer points updated")
    }
  }

  console.log("[v0] Attempting to delete supporter record:", supporterId)
  const { error: deleteError } = await serviceRoleClient.from("supporters").delete().eq("id", supporterId)

  if (deleteError) {
    console.error("[v0] Error deleting supporter:", {
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
      code: deleteError.code,
    })
    // Return error to user so they know the delete failed
    return {
      error: `Perfil criado, mas erro ao remover registro de apoiador: ${deleteError.message}. Por favor, remova manualmente.`,
    }
  }

  console.log("[v0] Supporter record deleted successfully")

  revalidatePath("/admin/supporters")
  revalidatePath("/admin/members")
  return { success: true }
}

// Badge Assignment and Removal Actions
export async function assignBadgeToUser(userId: string, badgeId: string) {
  const { supabase } = await checkAdmin()

  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle()

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

  revalidatePath("/admin/members")
  return { success: true }
}

export async function removeBadgeFromUser(userId: string, badgeId: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId)

  if (error) {
    console.error("[v0] Error removing badge:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/members")
  return { success: true }
}

// Supporter Actions
export async function deleteSupporter(supporterId: string) {
  await checkAdmin()

  console.log("[v0] Deleting supporter:", supporterId)

  const serviceRoleClient = createServiceRoleClient()

  // Check if supporter has a profile (converted member)
  const { data: supporter } = await serviceRoleClient
    .from("supporters")
    .select("auth_user_id, name")
    .eq("id", supporterId)
    .single()

  if (supporter?.auth_user_id) {
    const { data: profile } = await serviceRoleClient
      .from("profiles")
      .select("id")
      .eq("id", supporter.auth_user_id)
      .maybeSingle()

    if (profile) {
      console.log("[v0] Supporter has a profile, deleting phantom record")
    }
  }

  const { error: deleteError } = await serviceRoleClient.from("supporters").delete().eq("id", supporterId)

  if (deleteError) {
    console.error("[v0] Error deleting supporter:", {
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
      code: deleteError.code,
    })
    return { error: `Erro ao deletar apoiador: ${deleteError.message}` }
  }

  console.log("[v0] Supporter deleted successfully")

  revalidatePath("/admin/supporters")
  return { success: true }
}
