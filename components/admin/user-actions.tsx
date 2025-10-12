"use client"

import { useState } from "react"
import { MoreVertical, Shield, ShieldOff, Trash2, Award } from "lucide-react"
import { toggleUserAdmin, deleteUser, updateUserPoints } from "@/app/admin/actions"

export function UserActions({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleToggleAdmin() {
    setLoading(true)
    const result = await toggleUserAdmin(userId, !isAdmin)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
    setShowMenu(false)
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.")) return

    setLoading(true)
    const result = await deleteUser(userId)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
    setShowMenu(false)
  }

  async function handleAdjustPoints() {
    const points = prompt("Digite a nova quantidade de pontos:")
    if (!points) return

    setLoading(true)
    const result = await updateUserPoints(userId, Number.parseInt(points))

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
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-white/10 bg-black p-2 shadow-xl">
            <button
              onClick={handleToggleAdmin}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {isAdmin ? "Remover Admin" : "Tornar Admin"}
            </button>
            <button
              onClick={handleAdjustPoints}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <Award className="h-4 w-4" />
              Ajustar Pontos
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Deletando..." : "Deletar Usuário"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
