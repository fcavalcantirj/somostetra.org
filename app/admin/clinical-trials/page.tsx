import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Microscope, Search, MapPin, Users } from "lucide-react"
import { ClinicalTrialsClient } from "./clinical-trials-client"
import { searchClinicalTrials } from "./actions"

export default async function AdminClinicalTrials() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  // Default conditions for spinal cord injury trials (English - ClinicalTrials.gov uses EN)
  const defaultConditions = ["tetraplegia", "quadriplegia", "tetraparesis", "quadriparesis", "spinal cord injury"]

  // Fetch initial trials (default search with conditions)
  const initialResult = await searchClinicalTrials({
    conditions: defaultConditions,
    status: ["RECRUITING"],
    page_size: 20,
  })

  // Get counts for stats (with conditions)
  const recruitingResult = await searchClinicalTrials({
    conditions: defaultConditions,
    status: ["RECRUITING"],
    page_size: 1,
  })

  // Get Brazil trials count (with conditions)
  const brazilResult = await searchClinicalTrials({
    conditions: defaultConditions,
    status: ["RECRUITING"],
    latitude: -23.5505, // São Paulo
    longitude: -46.6333,
    distance: 3000, // Cover most of Brazil
    page_size: 1,
  })

  // Get member count by state
  const { data: membersByState } = await supabase
    .from("profiles")
    .select("state")
    .eq("user_type", "member")
    .not("state", "is", null)

  const statesWithMembers = [...new Set(membersByState?.map(m => m.state).filter(Boolean))]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Microscope className="h-6 w-6 text-primary" />
                Estudos Clínicos
              </h1>
              <p className="text-sm text-white/60">
                Buscar trials e notificar membros
              </p>
            </div>
          </div>
        </div>
      </div>

      <ClinicalTrialsClient
        initialTrials={initialResult.success ? initialResult.data.trials : []}
        initialTotalCount={initialResult.success ? initialResult.data.total_count : 0}
        statesWithMembers={statesWithMembers}
        recruitingCount={recruitingResult.success ? recruitingResult.data.total_count : 0}
        brazilCount={brazilResult.success ? brazilResult.data.total_count : 0}
      />
    </div>
  )
}
