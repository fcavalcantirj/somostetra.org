"use server"

import { createClient } from "@/lib/supabase/server"

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

// Search clinical trials via API
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

// Save search query for analytics/study
export interface SaveSearchParams {
  conditions: string[]
  status?: string[]
  phase?: string[]
  locationState?: string
  distance?: number
  brazilOnly: boolean
  resultsCount: number
}

export async function saveSearchQuery(
  params: SaveSearchParams
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const { error } = await supabase
      .from("clinical_trial_searches")
      .insert({
        user_id: user.id,
        query_conditions: params.conditions,
        query_status: params.status || null,
        query_phase: params.phase || null,
        query_location_state: params.locationState || null,
        query_distance: params.distance || null,
        brazil_only: params.brazilOnly,
        results_count: params.resultsCount,
      })

    if (error) {
      console.error("Error saving search query:", error)
      return { success: false, error: "Erro ao salvar busca" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error saving search query:", error)
    return { success: false, error: "Erro ao salvar busca" }
  }
}
