import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Microscope } from "lucide-react"
import { ClinicalTrialsClient } from "./clinical-trials-client"
import { searchClinicalTrials } from "./actions"

export default async function ClinicalTrialsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Default conditions for spinal cord injury trials (English - ClinicalTrials.gov uses EN)
  const defaultConditions = ["tetraplegia", "quadriplegia", "tetraparesis", "quadriparesis", "spinal cord injury"]

  // Fetch initial trials (default search with conditions)
  const initialResult = await searchClinicalTrials({
    conditions: defaultConditions,
    status: ["RECRUITING"],
    page_size: 20,
  })

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-[#00D5BE]/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted p-2 transition-colors hover:bg-muted/80 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Microscope className="h-5 w-5 sm:h-6 sm:w-6 text-[#00D5BE] shrink-0" />
                <span className="truncate">Estudos Clínicos</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Encontre estudos clínicos relevantes para você
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 hidden sm:block">
                Dados de{" "}
                <a
                  href="https://clinicaltrials.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  ClinicalTrials.gov
                </a>
                {" "}(U.S. National Library of Medicine)
              </p>
              <p className="text-xs text-muted-foreground/60 hidden md:block">
                Veja também:{" "}
                <a
                  href="http://www.ensaiosclinicos.gov.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  ensaiosclinicos.gov.br
                </a>
                {" "}(Registro Brasileiro de Ensaios Clínicos)
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 sm:pt-36 md:pt-44 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <ClinicalTrialsClient
            initialTrials={initialResult.success ? initialResult.data.trials : []}
            initialTotalCount={initialResult.success ? initialResult.data.total_count : 0}
          />
        </div>
      </main>
    </div>
  )
}
