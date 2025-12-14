"use client"

import { useState } from "react"
import { Check, X, Gift, Trash2, Loader2, Search, ExternalLink, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WISH_STATUS_LABELS, type WishStatus } from "@/app/dashboard/wishes/types"
import { approveWish, rejectWish, fulfillWish, deleteWishAdmin } from "@/app/admin/actions"

interface WishCategory {
  id: string
  name: string
  icon: string
}

interface Profile {
  id: string
  display_name: string
  username: string | null
  user_type?: string
  points?: number
}

interface Wish {
  id: string
  user_id: string
  content: string
  status: WishStatus
  category_id: string | null
  fulfilled_at: string | null
  fulfiller_user_id: string | null
  fulfiller_name: string | null
  fulfiller_email: string | null
  fulfiller_is_member: boolean | null
  fulfiller_points_awarded: number
  fulfilled_notes: string | null
  admin_notes: string | null
  approved_at: string | null
  created_at: string
  profiles: Profile
  wish_categories: WishCategory | null
}

interface WishesAdminClientProps {
  wishes: Wish[]
  categories: WishCategory[]
  allProfiles: Profile[]
}

export function WishesAdminClient({ wishes: initialWishes, categories, allProfiles }: WishesAdminClientProps) {
  const [wishes, setWishes] = useState(initialWishes)
  const [filter, setFilter] = useState<WishStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [approveModalWish, setApproveModalWish] = useState<Wish | null>(null)
  const [fulfillModalWish, setFulfillModalWish] = useState<Wish | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Fulfill form
  const [fulfillForm, setFulfillForm] = useState({
    fulfiller_name: "",
    fulfiller_email: "",
    fulfiller_user_id: "",
    is_existing_user: false,
    fulfilled_notes: "",
    points_to_award: 100,
  })

  const filteredWishes = wishes.filter(wish => {
    const matchesFilter = filter === "all" || wish.status === filter
    const matchesSearch = search === "" ||
      wish.content.toLowerCase().includes(search.toLowerCase()) ||
      wish.profiles.display_name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleApprove = async () => {
    if (!approveModalWish || !selectedCategory) {
      setError("Selecione uma categoria")
      return
    }

    setIsLoading(approveModalWish.id)
    setError(null)

    const result = await approveWish(approveModalWish.id, selectedCategory)

    if (result.success) {
      setWishes(wishes.map(w =>
        w.id === approveModalWish.id
          ? { ...w, status: "approved" as WishStatus, category_id: selectedCategory }
          : w
      ))
      setApproveModalWish(null)
      setSelectedCategory("")
    } else {
      setError(result.error || "Erro ao aprovar")
    }

    setIsLoading(null)
  }

  const handleReject = async (wishId: string) => {
    if (!confirm("Tem certeza que deseja rejeitar este desejo?")) return

    setIsLoading(wishId)
    setError(null)

    const result = await rejectWish(wishId)

    if (result.success) {
      setWishes(wishes.map(w =>
        w.id === wishId ? { ...w, status: "rejected" as WishStatus } : w
      ))
    } else {
      setError(result.error || "Erro ao rejeitar")
    }

    setIsLoading(null)
  }

  const handleFulfill = async () => {
    if (!fulfillModalWish) return
    if (!fulfillForm.fulfiller_name) {
      setError("Nome do realizador é obrigatório")
      return
    }

    setIsLoading(fulfillModalWish.id)
    setError(null)

    const result = await fulfillWish(fulfillModalWish.id, {
      fulfiller_name: fulfillForm.fulfiller_name,
      fulfiller_email: fulfillForm.fulfiller_email || undefined,
      fulfiller_user_id: fulfillForm.is_existing_user ? fulfillForm.fulfiller_user_id || undefined : undefined,
      fulfiller_is_member: fulfillForm.is_existing_user,
      fulfilled_notes: fulfillForm.fulfilled_notes || undefined,
      points_to_award: fulfillForm.points_to_award,
    })

    if (result.success) {
      setWishes(wishes.map(w =>
        w.id === fulfillModalWish.id
          ? {
              ...w,
              status: "fulfilled" as WishStatus,
              fulfilled_at: new Date().toISOString(),
              fulfiller_name: fulfillForm.fulfiller_name,
              fulfiller_points_awarded: fulfillForm.points_to_award,
            }
          : w
      ))
      setFulfillModalWish(null)
      setFulfillForm({
        fulfiller_name: "",
        fulfiller_email: "",
        fulfiller_user_id: "",
        is_existing_user: false,
        fulfilled_notes: "",
        points_to_award: 100,
      })
    } else {
      setError(result.error || "Erro ao marcar como realizado")
    }

    setIsLoading(null)
  }

  const handleDelete = async (wishId: string) => {
    if (!confirm("Tem certeza que deseja excluir este desejo permanentemente?")) return

    setIsLoading(wishId)
    setError(null)

    const result = await deleteWishAdmin(wishId)

    if (result.success) {
      setWishes(wishes.filter(w => w.id !== wishId))
    } else {
      setError(result.error || "Erro ao excluir")
    }

    setIsLoading(null)
  }

  const getSupporterInviteLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://somostetra.org"
    return `${baseUrl}/auth/supporter-signup`
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-white/5 border-white/10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "fulfilled", "rejected"].map((status) => (
            <Button
              key={status}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(status as WishStatus | "all")}
              className={filter === status ? "bg-white/10" : ""}
            >
              {status === "all" ? "Todos" : WISH_STATUS_LABELS[status as WishStatus].label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Wishes Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Membro</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Desejo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Categoria</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Data</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-white/60">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredWishes.map((wish) => {
              const statusInfo = WISH_STATUS_LABELS[wish.status]
              return (
                <tr key={wish.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-4">
                    <p className="font-medium">{wish.profiles.display_name}</p>
                    {wish.profiles.username && (
                      <p className="text-xs text-white/40">@{wish.profiles.username}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 max-w-md">
                    <p className="text-sm line-clamp-2">{wish.content}</p>
                  </td>
                  <td className="px-4 py-4">
                    {wish.wish_categories ? (
                      <span className="inline-flex items-center gap-1">
                        <span>{wish.wish_categories.icon}</span>
                        <span className="text-sm">{wish.wish_categories.name}</span>
                      </span>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/60">
                    {new Date(wish.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {wish.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setApproveModalWish(wish); setError(null) }}
                            disabled={isLoading === wish.id}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(wish.id)}
                            disabled={isLoading === wish.id}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {wish.status === "approved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setFulfillModalWish(wish); setError(null) }}
                          disabled={isLoading === wish.id}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Realizar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(wish.id)}
                        disabled={isLoading === wish.id}
                        className="text-red-400 hover:text-red-300"
                      >
                        {isLoading === wish.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredWishes.length === 0 && (
          <div className="text-center py-12 text-white/40">
            Nenhum desejo encontrado
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approveModalWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-white/10">
            <h3 className="text-xl font-bold mb-4">Aprovar Desejo</h3>

            <div className="mb-4 p-3 rounded-lg bg-white/5">
              <p className="text-sm text-white/60 mb-1">Desejo de {approveModalWish.profiles.display_name}:</p>
              <p>{approveModalWish.content}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria (para estatísticas)</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setApproveModalWish(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isLoading === approveModalWish.id || !selectedCategory}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading === approveModalWish.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Aprovar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModalWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Marcar como Realizado</h3>

            <div className="mb-4 p-3 rounded-lg bg-white/5">
              <p className="text-sm text-white/60 mb-1">Desejo de {fulfillModalWish.profiles.display_name}:</p>
              <p>{fulfillModalWish.content}</p>
            </div>

            <div className="space-y-4">
              {/* Existing user toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_existing_user"
                  checked={fulfillForm.is_existing_user}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, is_existing_user: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_existing_user">Realizador é membro/apoiador existente</Label>
              </div>

              {fulfillForm.is_existing_user ? (
                <div className="space-y-2">
                  <Label>Selecionar Membro/Apoiador</Label>
                  <select
                    value={fulfillForm.fulfiller_user_id}
                    onChange={(e) => {
                      const profile = allProfiles.find(p => p.id === e.target.value)
                      setFulfillForm({
                        ...fulfillForm,
                        fulfiller_user_id: e.target.value,
                        fulfiller_name: profile?.display_name || "",
                      })
                    }}
                    className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                  >
                    <option value="">Selecione...</option>
                    {allProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.display_name} ({profile.user_type === "member" ? "Membro" : "Apoiador"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Nome do Realizador *</Label>
                    <Input
                      value={fulfillForm.fulfiller_name}
                      onChange={(e) => setFulfillForm({ ...fulfillForm, fulfiller_name: e.target.value })}
                      placeholder="Nome de quem realizou o desejo"
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>E-mail (para enviar convite de apoiador)</Label>
                    <Input
                      type="email"
                      value={fulfillForm.fulfiller_email}
                      onChange={(e) => setFulfillForm({ ...fulfillForm, fulfiller_email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  {fulfillForm.fulfiller_email && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-blue-400 mb-2">Enviar convite de apoiador:</p>
                      <a
                        href={`mailto:${fulfillForm.fulfiller_email}?subject=Obrigado por realizar um desejo na SomosTetra!&body=Olá ${fulfillForm.fulfiller_name},%0D%0A%0D%0AObrigado por realizar o desejo de um membro da nossa comunidade!%0D%0A%0D%0AQue tal fazer parte da nossa rede de apoiadores?%0D%0ACadastre-se em: ${getSupporterInviteLink()}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        Enviar e-mail de convite
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Pontos a conceder</Label>
                <Input
                  type="number"
                  value={fulfillForm.points_to_award}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, points_to_award: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="bg-white/5 border-white/10"
                />
                <p className="text-xs text-white/40">
                  {fulfillForm.is_existing_user
                    ? "Pontos serão adicionados imediatamente ao perfil"
                    : "Pontos serão registrados para quando o realizador se cadastrar"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notas sobre a realização (opcional)</Label>
                <Textarea
                  value={fulfillForm.fulfilled_notes}
                  onChange={(e) => setFulfillForm({ ...fulfillForm, fulfilled_notes: e.target.value })}
                  placeholder="Detalhes sobre como o desejo foi realizado..."
                  rows={3}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setFulfillModalWish(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleFulfill}
                disabled={isLoading === fulfillModalWish.id || !fulfillForm.fulfiller_name}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading === fulfillModalWish.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                Marcar como Realizado
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
