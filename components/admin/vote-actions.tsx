"use client"

import { useState } from "react"
import { MoreVertical, Trash2, CheckCircle, XCircle, Pencil } from "lucide-react"
import { deleteVote, updateVoteStatus } from "@/app/admin/actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export function VoteActions({ voteId, currentStatus }: { voteId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar esta votação?")) return

    setLoading(true)
    const result = await deleteVote(voteId)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
  }

  async function handleStatusChange(status: string) {
    setLoading(true)
    const result = await updateVoteStatus(voteId, status)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
  }

  function handleEdit() {
    router.push(`/admin/votes/${voteId}/edit`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-lg p-2 transition-colors hover:bg-white/10">
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleEdit} disabled={loading}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {currentStatus !== "completed" && (
          <DropdownMenuItem onClick={() => handleStatusChange("completed")} disabled={loading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar como Concluída
          </DropdownMenuItem>
        )}
        {currentStatus !== "closed" && (
          <DropdownMenuItem onClick={() => handleStatusChange("closed")} disabled={loading}>
            <XCircle className="mr-2 h-4 w-4" />
            Fechar Votação
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDelete} disabled={loading} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {loading ? "Deletando..." : "Deletar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
