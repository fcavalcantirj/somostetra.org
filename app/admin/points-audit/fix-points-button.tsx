"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wrench, Loader2, CheckCircle } from "lucide-react"
import { fixUserPoints, fixAllIncorrectPoints } from "./actions"

interface FixPointsButtonProps {
  userId: string
  displayName: string
  currentPoints: number
  correctPoints: number
  variant?: "single" | "bulk"
  incorrectUsers?: Array<{
    id: string
    display_name: string
    expected_points: number
  }>
}

export function FixPointsButton({
  userId,
  displayName,
  currentPoints,
  correctPoints,
  variant = "single",
  incorrectUsers = [],
}: FixPointsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [fixed, setFixed] = useState(false)

  const handleFixSingle = async () => {
    if (!confirm(`Corrigir pontos de ${displayName}?\n\n${currentPoints} → ${correctPoints} pontos`)) {
      return
    }

    setLoading(true)
    const result = await fixUserPoints(userId, correctPoints)

    if (result.success) {
      setFixed(true)
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      alert(`Erro: ${result.error}`)
      setLoading(false)
    }
  }

  const handleFixAll = async () => {
    if (
      !confirm(
        `Corrigir pontos de ${incorrectUsers.length} usuários?\n\nIsso ajustará todos os pontos para os valores calculados corretos.`
      )
    ) {
      return
    }

    setLoading(true)
    const users = incorrectUsers.map((u) => ({
      id: u.id,
      correctPoints: u.expected_points,
      displayName: u.display_name,
    }))

    const result = await fixAllIncorrectPoints(users)

    if (result.successCount === result.totalCount) {
      alert(`✅ Sucesso! ${result.successCount} usuários corrigidos.`)
      window.location.reload()
    } else {
      const failed = result.results.filter((r) => !r.success)
      alert(
        `⚠️ Parcialmente concluído:\n${result.successCount}/${result.totalCount} corrigidos.\n\nFalhas:\n${failed.map((f) => `- ${f.displayName}: ${f.error}`).join("\n")}`
      )
      setLoading(false)
    }
  }

  if (variant === "bulk") {
    return (
      <Button
        onClick={handleFixAll}
        disabled={loading || incorrectUsers.length === 0}
        size="lg"
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Corrigindo...
          </>
        ) : (
          <>
            <Wrench className="mr-2 h-5 w-5" />
            Corrigir Todos ({incorrectUsers.length})
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleFixSingle}
      disabled={loading || fixed}
      size="sm"
      variant="outline"
      className="border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : fixed ? (
        <CheckCircle className="mr-2 h-4 w-4" />
      ) : (
        <Wrench className="mr-2 h-4 w-4" />
      )}
      {fixed ? "Corrigido!" : "Corrigir"}
    </Button>
  )
}
