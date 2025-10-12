"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { createBadge } from "@/app/admin/actions"

export function CreateBadgeDialog({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createBadge(formData)

    if (result.success) {
      onClose()
    } else {
      alert(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nova Badge</h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Nome</label>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition-colors focus:border-white/20 focus:outline-none"
              placeholder="Ex: Pioneiro"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Descrição</label>
            <textarea
              name="description"
              required
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition-colors focus:border-white/20 focus:outline-none"
              placeholder="Descreva a conquista..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Ícone (emoji)</label>
            <input
              type="text"
              name="icon"
              required
              maxLength={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition-colors focus:border-white/20 focus:outline-none"
              placeholder="🏆"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Pontos Necessários</label>
            <input
              type="number"
              name="points_required"
              required
              min="0"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition-colors focus:border-white/20 focus:outline-none"
              placeholder="100"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-medium transition-colors hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Badge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
