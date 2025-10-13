"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { trackVoteSubmission, trackVoteError } from "@/lib/analytics"

export function VoteButton({
  voteId,
  userId,
  voteTitle,
  userType,
}: {
  voteId: string
  userId: string
  voteTitle?: string
  userType: "member" | "supporter"
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleVote = async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      console.log("[v0] Starting vote process for voteId:", voteId)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("[v0] Auth error:", authError)
        throw new Error("Erro de autenticação. Por favor, faça login novamente.")
      }

      if (!user) {
        console.error("[v0] No user found in session")
        throw new Error("Você precisa estar logado para votar")
      }

      console.log("[v0] User authenticated:", user.id)

      const { data: existingVote, error: checkError } = await supabase
        .from("user_votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("vote_id", voteId)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Error checking existing vote:", checkError)
        throw new Error("Erro ao verificar voto existente")
      }

      if (existingVote) {
        console.log("[v0] User has already voted")
        throw new Error("Você já votou nesta pauta")
      }

      console.log("[v0] Inserting vote...")

      const { error: insertError } = await supabase.from("user_votes").insert({
        user_id: user.id,
        vote_id: voteId,
      })

      if (insertError) {
        console.error("[v0] Insert error:", insertError)

        if (insertError.code === "23505") {
          throw new Error("Você já votou nesta pauta")
        }
        if (insertError.code === "23503") {
          throw new Error("Votação não encontrada")
        }
        if (insertError.message.includes("policy")) {
          throw new Error("Permissão negada. Verifique se você está logado corretamente.")
        }

        throw new Error(`Erro ao votar: ${insertError.message}`)
      }

      console.log("[v0] Vote successful!")
      trackVoteSubmission(voteId, voteTitle || "Unknown Vote", userType)

      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao votar"
      console.error("[v0] Vote error:", errorMessage)
      setError(errorMessage)
      trackVoteError(voteId, voteTitle || "Unknown Vote", userType, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">{error}</p>}

      <Button
        onClick={handleVote}
        size="lg"
        className="w-full gradient-primary font-bold h-16 text-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          "Votando..."
        ) : (
          <>
            <CheckCircle2 className="w-6 h-6 mr-2" />
            Confirmar Voto
          </>
        )}
      </Button>
    </div>
  )
}
