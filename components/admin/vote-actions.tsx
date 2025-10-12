"use client"

import { useState } from "react"
import { MoreVertical, Trash2, CheckCircle, XCircle } from "lucide-react"
import { deleteVote, updateVoteStatus } from "@/app/admin/actions"

export function VoteActions({ voteId, currentStatus }: { voteId: string; currentStatus: string }) {
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar esta votação?")) return

    setLoading(true)
    const result = await deleteVote(voteId)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
    setShowMenu(false)
  }

  async function handleStatusChange(status: string) {
    setLoading(true)
    const result = await updateVoteStatus(voteId, status)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="rounded-lg p-2 transition-colors hover:bg-white/10">
        <MoreVertical className="h-5 w-5" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-white/10 bg-black p-2 shadow-xl">
            {currentStatus !== "completed" && (
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Marcar como Concluída
              </button>
            )}
            {currentStatus !== "closed" && (
              <button
                onClick={() => handleStatusChange("closed")}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Fechar Votação
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Deletando..." : "Deletar"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
