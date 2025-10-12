"use client"

import { useState } from "react"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { deleteBadge } from "@/app/admin/actions"

export function BadgeActions({ badgeId }: { badgeId: string }) {
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar esta badge?")) return

    setLoading(true)
    const result = await deleteBadge(badgeId)

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
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10">
              <Pencil className="h-4 w-4" />
              Editar
            </button>
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
