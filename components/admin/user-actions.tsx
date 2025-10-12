"use client"

import { useState } from "react"
import { MoreVertical, Shield, ShieldOff, Trash2, Award, Medal } from "lucide-react"
import {
  toggleUserAdmin,
  deleteUser,
  updateUserPoints,
  assignBadgeToUser,
  removeBadgeFromUser,
} from "@/app/admin/actions"

interface Badge {
  id: string
  name: string
  icon: string
  points_required: number
}

interface UserBadge {
  badge_id: string
  badges?: Badge
}

export function UserActions({
  userId,
  isAdmin,
  userBadges,
  allBadges,
}: {
  userId: string
  isAdmin: boolean
  userBadges: UserBadge[]
  allBadges: Badge[]
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showBadgeMenu, setShowBadgeMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const userBadgeIds = userBadges.map((ub) => ub.badge_id)
  const availableBadges = allBadges.filter((b) => !userBadgeIds.includes(b.id))
  const earnedBadges = allBadges.filter((b) => userBadgeIds.includes(b.id))

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

  async function handleAssignBadge(badgeId: string) {
    setLoading(true)
    const result = await assignBadgeToUser(userId, badgeId)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
    setShowBadgeMenu(false)
  }

  async function handleRemoveBadge(badgeId: string) {
    if (!confirm("Tem certeza que deseja remover esta badge?")) return

    setLoading(true)
    const result = await removeBadgeFromUser(userId, badgeId)

    if (result.error) {
      alert(result.error)
    }

    setLoading(false)
    setShowBadgeMenu(false)
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
              onClick={() => {
                setShowMenu(false)
                setShowBadgeMenu(true)
              }}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <Medal className="h-4 w-4" />
              Gerenciar Badges
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

      {showBadgeMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowBadgeMenu(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-white/10 bg-black p-3 shadow-xl">
            <h3 className="mb-2 text-sm font-medium text-white/60">Gerenciar Badges</h3>

            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs text-white/40">Badges Conquistadas</p>
                <div className="space-y-1">
                  {earnedBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{badge.icon}</span>
                        <span className="text-sm">{badge.name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveBadge(badge.id)}
                        disabled={loading}
                        className="rounded px-2 py-0.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Badges */}
            {availableBadges.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-white/40">Badges Disponíveis</p>
                <div className="space-y-1">
                  {availableBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{badge.icon}</span>
                        <div>
                          <span className="text-sm">{badge.name}</span>
                          <span className="ml-1 text-xs text-white/40">({badge.points_required} pts)</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignBadge(badge.id)}
                        disabled={loading}
                        className="rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                      >
                        Atribuir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableBadges.length === 0 && earnedBadges.length === 0 && (
              <p className="text-center text-sm text-white/40">Nenhuma badge disponível</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
