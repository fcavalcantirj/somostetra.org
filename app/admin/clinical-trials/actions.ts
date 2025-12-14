"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const CLINICAL_TRIALS_API_URL = process.env.CLINICAL_TRIALS_API_URL || "https://clinical-trials-microservice-production.up.railway.app"

// Types
export interface TrialLocation {
  city: string
  state?: string
  country: string
  latitude?: number
  longitude?: number
  zip_code?: string
}

export interface TrialEligibility {
  minimum_age?: string
  maximum_age?: string
  gender: string
  criteria?: string
}

export interface TrialSponsor {
  name: string
  type: string
  category?: string
}

export interface TrialContact {
  name?: string
  phone?: string
  email?: string
}

export interface Trial {
  nct_id: string
  title: string
  status: string
  phase: string[]
  conditions: string[]
  locations: TrialLocation[]
  eligibility: TrialEligibility
  sponsor: TrialSponsor
  contacts?: TrialContact[]
  start_date?: string
  completion_date?: string
  brief_summary?: string
  detailed_summary?: string
  url: string
  registry: string
}

export interface SearchFilters {
  conditions?: string[]
  status?: string[]
  phase?: string[]
  latitude?: number
  longitude?: number
  distance?: number
  page_size?: number
  page_token?: string
}

export interface SearchResult {
  trials: Trial[]
  total_count: number
  next_page_token?: string
  page_size: number
}

export interface Member {
  id: string
  display_name: string
  email?: string
  city?: string
  state?: string
  injury_level?: string
  asia_scale?: string
}

// Search clinical trials via localhost:8080 API
export async function searchClinicalTrials(
  filters: SearchFilters
): Promise<{ success: true; data: SearchResult } | { success: false; error: string }> {
  try {
    const response = await fetch(`${CLINICAL_TRIALS_API_URL}/api/v1/trials/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conditions: filters.conditions || ["tetraplegia", "quadriplegia", "spinal cord injury"],
        status: filters.status || ["RECRUITING", "NOT_YET_RECRUITING"],
        phase: filters.phase,
        latitude: filters.latitude,
        longitude: filters.longitude,
        distance: filters.distance,
        page_size: filters.page_size || 20,
        page_token: filters.page_token,
      }),
      // Don't cache API calls
      cache: "no-store",
    })

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Error searching clinical trials:", error)
    return { success: false, error: "Erro ao buscar estudos clínicos. Verifique se a API está rodando." }
  }
}

// Get single trial by NCT ID
export async function getTrialById(
  nctId: string
): Promise<{ success: true; data: Trial } | { success: false; error: string }> {
  try {
    const response = await fetch(`${CLINICAL_TRIALS_API_URL}/api/v1/trials/${nctId}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return { success: false, error: `Estudo não encontrado: ${nctId}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching trial:", error)
    return { success: false, error: "Erro ao buscar detalhes do estudo." }
  }
}

// Get members matching criteria (by state)
export async function getMembersForNotification(filters?: {
  states?: string[]
}): Promise<{ success: true; data: Member[] } | { success: false; error: string }> {
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

  // Build query
  let query = supabase
    .from("profiles")
    .select("id, display_name, email, city, state, injury_level, asia_scale")
    .eq("user_type", "member")
    .order("display_name", { ascending: true })

  // Filter by states if provided
  if (filters?.states && filters.states.length > 0) {
    query = query.in("state", filters.states)
  }

  const { data: members, error } = await query

  if (error) {
    console.error("Error fetching members:", error)
    return { success: false, error: "Erro ao buscar membros" }
  }

  return { success: true, data: members || [] }
}

// Get members who were already notified about a specific trial
export async function getNotifiedMembersForTrial(
  nctId: string
): Promise<{ success: true; data: string[] } | { success: false; error: string }> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("clinical_trial_notifications")
    .select("member_id")
    .eq("nct_id", nctId)

  if (error) {
    console.error("Error fetching notified members:", error)
    return { success: false, error: "Erro ao verificar notificações anteriores" }
  }

  return { success: true, data: data?.map(n => n.member_id) || [] }
}

// Send notification to specific members about a trial
export async function notifyMembersAboutTrial(data: {
  nct_id: string
  trial_title: string
  member_ids: string[]
  custom_message?: string
}): Promise<{ success: boolean; sent_count: number; error?: string }> {
  const supabase = await createServerClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, sent_count: 0, error: "Não autenticado" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    return { success: false, sent_count: 0, error: "Sem permissão" }
  }

  // Get member emails for logging
  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", data.member_ids)

  if (!members || members.length === 0) {
    return { success: false, sent_count: 0, error: "Nenhum membro encontrado" }
  }

  // Insert notifications (will fail on duplicates due to UNIQUE constraint)
  const notifications = members.map(member => ({
    nct_id: data.nct_id,
    trial_title: data.trial_title,
    member_id: member.id,
    notified_by: user.id,
    custom_message: data.custom_message || null,
  }))

  const { data: inserted, error } = await supabase
    .from("clinical_trial_notifications")
    .insert(notifications)
    .select()

  if (error) {
    // Check if it's a duplicate error
    if (error.code === "23505") {
      return { success: false, sent_count: 0, error: "Alguns membros já foram notificados sobre este estudo" }
    }
    console.error("Error inserting notifications:", error)
    return { success: false, sent_count: 0, error: "Erro ao registrar notificações" }
  }

  // Log emails that would be sent (future: actually send)
  for (const member of members) {
    console.log(`[Clinical Trial Notification] Would send email to ${member.email} about trial ${data.nct_id}`)
  }

  revalidatePath("/admin/clinical-trials")
  return { success: true, sent_count: inserted?.length || members.length }
}

// Get notification history for admin view
export async function getNotificationHistory(
  filters?: { nct_id?: string; member_id?: string; limit?: number }
): Promise<{ success: true; data: unknown[] } | { success: false; error: string }> {
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

  let query = supabase
    .from("clinical_trial_notifications")
    .select(`
      *,
      member:profiles!member_id(display_name, email),
      admin:profiles!notified_by(display_name)
    `)
    .order("sent_at", { ascending: false })
    .limit(filters?.limit || 50)

  if (filters?.nct_id) {
    query = query.eq("nct_id", filters.nct_id)
  }

  if (filters?.member_id) {
    query = query.eq("member_id", filters.member_id)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching notification history:", error)
    return { success: false, error: "Erro ao buscar histórico" }
  }

  return { success: true, data: data || [] }
}
