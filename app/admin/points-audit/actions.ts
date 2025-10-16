"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fixUserPoints(userId: string, correctPoints: number) {
  const serviceClient = createServiceRoleClient()

  console.log(`[v0] Fixing points for user ${userId} to ${correctPoints}`)

  const { error } = await serviceClient
    .from("profiles")
    .update({ points: correctPoints })
    .eq("id", userId)

  if (error) {
    console.error("[v0] Error fixing points:", error)
    return { success: false, error: error.message }
  }

  console.log(`[v0] Points fixed successfully`)
  revalidatePath("/admin/points-audit")
  return { success: true }
}

export async function fixAllIncorrectPoints(
  users: Array<{ id: string; correctPoints: number; displayName: string }>
) {
  const serviceClient = createServiceRoleClient()

  console.log(`[v0] Fixing points for ${users.length} users`)

  const results = []

  for (const user of users) {
    try {
      const { error } = await serviceClient
        .from("profiles")
        .update({ points: user.correctPoints })
        .eq("id", user.id)

      if (error) {
        console.error(`[v0] Error fixing points for ${user.displayName}:`, error)
        results.push({
          userId: user.id,
          displayName: user.displayName,
          success: false,
          error: error.message,
        })
      } else {
        console.log(`[v0] Fixed points for ${user.displayName}`)
        results.push({
          userId: user.id,
          displayName: user.displayName,
          success: true,
        })
      }
    } catch (error: any) {
      console.error(`[v0] Unexpected error fixing ${user.displayName}:`, error)
      results.push({
        userId: user.id,
        displayName: user.displayName,
        success: false,
        error: error.message,
      })
    }
  }

  const successCount = results.filter((r) => r.success).length
  console.log(`[v0] Fixed ${successCount}/${users.length} users`)

  revalidatePath("/admin/points-audit")
  return { results, successCount, totalCount: users.length }
}
