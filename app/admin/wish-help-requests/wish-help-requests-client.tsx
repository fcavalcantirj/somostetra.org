"use client"

import { useState } from "react"
import { Mail, Phone, Calendar, User, Gift, MessageSquare, Check, X, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateHelpRequestStatus, deleteHelpRequest } from "./actions"

interface WishProfile {
  id: string
  display_name: string
  username: string | null
}

interface Wish {
  id: string
  content: string
  status: string
  profiles: WishProfile | WishProfile[] | null
}

interface HelpRequest {
  id: string
  wish_id: string
  helper_name: string
  helper_email: string
  helper_phone: string | null
  message: string | null
  status: string
  created_at: string
  wishes: Wish | null
}

interface WishHelpRequestsClientProps {
  requests: HelpRequest[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  contacted: { label: "Contatado", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  completed: { label: "Concluído", color: "bg-green-500/10 text-green-400 border-green-500/30" },
  declined: { label: "Recusado", color: "bg-red-500/10 text-red-400 border-red-500/30" },
}

export function WishHelpRequestsClient({ requests: initialRequests }: WishHelpRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredRequests = filter === "all"
    ? requests
    : requests.filter(r => r.status === filter)

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setUpdatingId(requestId)

    const result = await updateHelpRequestStatus(requestId, newStatus)

    if (result.success) {
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: newStatus } : r
      ))
    }

    setUpdatingId(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(true)

    const result = await deleteHelpRequest(deleteConfirmId)

    if (result.success) {
      setRequests(prev => prev.filter(r => r.id !== deleteConfirmId))
    }

    setIsDeleting(false)
    setDeleteConfirmId(null)
  }

  const getMemberName = (wish: Wish | null): string => {
    if (!wish?.profiles) return "Membro"
    if (Array.isArray(wish.profiles)) {
      return wish.profiles[0]?.display_name || "Membro"
    }
    return wish.profiles.display_name || "Membro"
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "Todos" },
          { value: "pending", label: "Pendentes" },
          { value: "contacted", label: "Contatados" },
          { value: "completed", label: "Concluídos" },
          { value: "declined", label: "Recusados" },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          Nenhuma oferta de ajuda encontrada.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(request => {
            const statusInfo = STATUS_LABELS[request.status] || STATUS_LABELS.pending
            const memberName = getMemberName(request.wishes)
            const isUpdating = updatingId === request.id

            return (
              <div
                key={request.id}
                className="p-6 rounded-xl bg-white/5 border border-white/10"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{request.helper_name}</p>
                      <p className="text-sm text-white/60 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${request.helper_email}`} className="hover:text-white">
                          {request.helper_email}
                        </a>
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Contact Info */}
                {request.helper_phone && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-white/70">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${request.helper_phone}`} className="hover:text-white">
                      {request.helper_phone}
                    </a>
                  </div>
                )}

                {/* Message */}
                {request.message && (
                  <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      Mensagem
                    </div>
                    <p className="text-white/90">{request.message}</p>
                  </div>
                )}

                {/* Wish Info */}
                {request.wishes && (
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2 text-sm text-primary/80 mb-2">
                      <Gift className="h-4 w-4" />
                      Desejo de {memberName}
                    </div>
                    <p className="text-white/90 line-clamp-2">{request.wishes.content}</p>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
                  <Calendar className="h-4 w-4" />
                  {new Date(request.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  {request.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, "contacted")}
                        disabled={isUpdating}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Marcar Contatado
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(request.id, "declined")}
                        disabled={isUpdating}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                    </>
                  )}

                  {request.status === "contacted" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(request.id, "completed")}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Marcar Concluído
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirmId(request.id)}
                    className="ml-auto text-white/50 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oferta de Ajuda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta oferta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
