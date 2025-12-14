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
  await checkAdmin()

  console.log("[v0] Deleting user:", userId)

  const serviceRoleClient = createServiceRoleClient()

  try {
    // Step 1: Delete related records that might not cascade properly
    // Delete user_badges
    await serviceRoleClient.from("user_badges").delete().eq("user_id", userId)

    // Delete user_votes
    await serviceRoleClient.from("user_votes").delete().eq("user_id", userId)

    // Delete activities
    await serviceRoleClient.from("activities").delete().eq("user_id", userId)

    // Delete referrals where user is referrer or referred
    await serviceRoleClient.from("referrals").delete().eq("referrer_id", userId)
    await serviceRoleClient.from("referrals").delete().eq("referred_id", userId)

    // Update other profiles that were referred by this user (set to null)
    await serviceRoleClient.from("profiles").update({ referred_by: null }).eq("referred_by", userId)

    // Delete votes created by this user (will cascade to user_votes)
    await serviceRoleClient.from("votes").delete().eq("created_by", userId)

    // Step 2: Delete profile
    const { error: profileError } = await serviceRoleClient.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("[v0] Error deleting profile:", profileError)
      return { error: `Erro ao deletar perfil: ${profileError.message}` }
    }

    // Step 3: Delete auth user
    const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("[v0] Error deleting auth user:", authError)
      // Profile already deleted, so warn but don't fail
      return { error: `Perfil deletado, mas erro ao deletar autenticação: ${authError.message}` }
    }

    console.log("[v0] User deleted successfully")

    revalidatePath("/admin/members")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Unexpected error deleting user:", error)
    return { error: `Erro inesperado: ${error.message || error}` }
  }
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

  try {
    // Get supporter data to check for auth_user_id
    const { data: supporter } = await serviceRoleClient
      .from("supporters")
      .select("auth_user_id, name, email")
      .eq("id", supporterId)
      .single()

    if (!supporter) {
      return { error: "Apoiador não encontrado" }
    }

    // Step 1: Delete supporter record from supporters table
    const { error: deleteError } = await serviceRoleClient.from("supporters").delete().eq("id", supporterId)

    if (deleteError) {
      console.error("[v0] Error deleting supporter record:", deleteError)
      return { error: `Erro ao deletar registro de apoiador: ${deleteError.message}` }
    }

    console.log("[v0] Supporter record deleted")

    // Step 2: If supporter has auth user, delete it too
    if (supporter.auth_user_id) {
      console.log("[v0] Supporter has auth user, deleting:", supporter.auth_user_id)

      // Check if they have a profile (converted to member)
      const { data: profile } = await serviceRoleClient
        .from("profiles")
        .select("id, user_type")
        .eq("id", supporter.auth_user_id)
        .maybeSingle()

      if (profile) {
        console.log("[v0] WARNING: Supporter has a profile with user_type:", profile.user_type)
        return {
          error: `Este apoiador foi convertido em ${profile.user_type}. Use a página de ${profile.user_type === "member" ? "membros" : "apoiadores"} para deletar.`,
        }
      }

      // Delete the auth user (no profile exists)
      const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(supporter.auth_user_id)

      if (authError) {
        console.error("[v0] Error deleting auth user:", authError)
        return {
          error: `Registro de apoiador deletado, mas erro ao deletar autenticação: ${authError.message}`,
        }
      }

      console.log("[v0] Auth user deleted successfully")
    }

    console.log("[v0] Supporter deleted completely")

    revalidatePath("/admin/supporters")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Unexpected error deleting supporter:", error)
    return { error: `Erro inesperado: ${error.message || error}` }
  }
}

// ============================================
// Wish Category Actions
// ============================================

export async function createWishCategory(name: string, icon: string, description: string | null) {
  const { supabase } = await checkAdmin()

  const { data, error } = await supabase
    .from("wish_categories")
    .insert({
      name,
      icon,
      description,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating wish category:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/wish-categories")
  return { success: true, category: data }
}

export async function updateWishCategory(
  categoryId: string,
  name: string,
  icon: string,
  description: string | null,
  isActive?: boolean
) {
  const { supabase } = await checkAdmin()

  const updateData: Record<string, unknown> = {
    name,
    icon,
    description,
  }

  if (isActive !== undefined) {
    updateData.is_active = isActive
  }

  const { error } = await supabase
    .from("wish_categories")
    .update(updateData)
    .eq("id", categoryId)

  if (error) {
    console.error("[v0] Error updating wish category:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/wish-categories")
  revalidatePath("/admin/wishes")
  return { success: true }
}

export async function deleteWishCategory(categoryId: string) {
  const { supabase } = await checkAdmin()

  // Soft delete - just set is_active to false
  const { error } = await supabase
    .from("wish_categories")
    .update({ is_active: false })
    .eq("id", categoryId)

  if (error) {
    console.error("[v0] Error deleting wish category:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/wish-categories")
  return { success: true }
}

// ============================================
// Wish Actions
// ============================================

export async function approveWish(wishId: string, categoryId: string) {
  const { supabase, user } = await checkAdmin()

  const { error } = await supabase
    .from("wishes")
    .update({
      status: "approved",
      category_id: categoryId,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", wishId)
    .eq("status", "pending")

  if (error) {
    console.error("[v0] Error approving wish:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/wishes")
  return { success: true }
}

export async function rejectWish(wishId: string, reason?: string) {
  const { supabase, user } = await checkAdmin()

  const { error } = await supabase
    .from("wishes")
    .update({
      status: "rejected",
      admin_notes: reason || null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", wishId)

  if (error) {
    console.error("[v0] Error rejecting wish:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/wishes")
  return { success: true }
}

interface FulfillWishData {
  fulfiller_name: string
  fulfiller_email?: string
  fulfiller_user_id?: string
  fulfiller_is_member: boolean
  fulfilled_notes?: string
  points_to_award: number
}

export async function fulfillWish(wishId: string, data: FulfillWishData) {
  const { supabase } = await checkAdmin()
  const serviceRoleClient = createServiceRoleClient()

  // Update wish as fulfilled
  const { error: wishError } = await supabase
    .from("wishes")
    .update({
      status: "fulfilled",
      fulfilled_at: new Date().toISOString(),
      fulfiller_user_id: data.fulfiller_user_id || null,
      fulfiller_name: data.fulfiller_name,
      fulfiller_email: data.fulfiller_email || null,
      fulfiller_is_member: data.fulfiller_is_member,
      fulfiller_points_awarded: data.points_to_award,
      fulfilled_notes: data.fulfilled_notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wishId)
    .eq("status", "approved")

  if (wishError) {
    console.error("[v0] Error fulfilling wish:", wishError)
    return { error: wishError.message }
  }

  // Award points to fulfiller if they are an existing user
  if (data.fulfiller_user_id && data.points_to_award > 0) {
    const { error: pointsError } = await serviceRoleClient.rpc("increment_user_points", {
      user_id: data.fulfiller_user_id,
      points_to_add: data.points_to_award,
    })

    if (pointsError) {
      console.error("[v0] Error awarding points to fulfiller:", pointsError)
      // Don't fail the fulfillment if points fail
    } else {
      console.log("[v0] Points awarded to fulfiller:", data.points_to_award)

      // Check and award badges after points update
      await serviceRoleClient.rpc("check_and_award_badges", {
        p_user_id: data.fulfiller_user_id,
      })
    }
  }

  revalidatePath("/admin/wishes")
  return { success: true }
}

export async function deleteWishAdmin(wishId: string) {
  const { supabase } = await checkAdmin()

  const { error } = await supabase.from("wishes").delete().eq("id", wishId)

  if (error) {
    console.error("[v0] Error deleting wish:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/wishes")
  return { success: true }
}
