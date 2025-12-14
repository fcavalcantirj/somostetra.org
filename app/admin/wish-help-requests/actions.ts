"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateHelpRequestStatus(
  requestId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return { success: false, error: "Sem permissão" }
  }

  // Update status
  const { error } = await supabase
    .from("wish_help_requests")
    .update({ status })
    .eq("id", requestId)

  if (error) {
    console.error("Error updating help request status:", error)
    return { success: false, error: "Erro ao atualizar status" }
  }

  revalidatePath("/admin/wish-help-requests")
  return { success: true }
}

export async function deleteHelpRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return { success: false, error: "Sem permissão" }
  }

  // Delete
  const { error } = await supabase
    .from("wish_help_requests")
    .delete()
    .eq("id", requestId)

  if (error) {
    console.error("Error deleting help request:", error)
    return { success: false, error: "Erro ao excluir" }
  }

  revalidatePath("/admin/wish-help-requests")
  return { success: true }
}
