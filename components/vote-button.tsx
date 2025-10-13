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
      const { error } = await supabase.from("user_votes").insert({
        user_id: userId,
        vote_id: voteId,
      })

      if (error) throw error

      trackVoteSubmission(voteId, voteTitle || "Unknown Vote", userType)

      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao votar"
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
