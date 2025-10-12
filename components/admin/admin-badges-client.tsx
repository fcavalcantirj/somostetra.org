"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { CreateBadgeDialog } from "@/components/admin/create-badge-dialog"
import { BadgeActions } from "@/components/admin/badge-actions"

export function AdminBadgesClient({ badges }: { badges: any[] }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Badges</h1>
              <p className="text-sm text-white/60">{badges?.length || 0} badges disponíveis</p>
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 font-medium transition-opacity hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
              Nova Badge
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {badges?.map((badge) => (
            <div
              key={badge.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="text-4xl">{badge.icon}</div>
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                  {badge.points_required} pts
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{badge.name}</h3>
              <p className="mb-4 text-sm text-white/60">{badge.description}</p>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="text-sm text-white/60">{badge.earned?.[0]?.count || 0} conquistadas</div>
                <BadgeActions badgeId={badge.id} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateDialog && <CreateBadgeDialog onClose={() => setShowCreateDialog(false)} />}
    </>
  )
}
