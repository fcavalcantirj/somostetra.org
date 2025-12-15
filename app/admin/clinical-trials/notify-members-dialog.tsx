"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, MapPin, Check, CheckSquare, Square, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getMembersForNotification,
  getNotifiedMembersForTrial,
  notifyMembersAboutTrial,
  type Trial,
  type Member,
} from "./actions"

interface NotifyMembersDialogProps {
  trial: Trial
  open: boolean
  onOpenChange: (open: boolean) => void
  statesWithMembers: string[]
}

export function NotifyMembersDialog({
  trial,
  open,
  onOpenChange,
  statesWithMembers,
}: NotifyMembersDialogProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [notifiedIds, setNotifiedIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterState, setFilterState] = useState<string>("")
  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get Brazil locations from trial
  const brazilLocations = (trial.locations || []).filter(loc => loc.country === "Brazil")
  const trialStates = brazilLocations
    .map(loc => loc.state)
    .filter((state): state is string => !!state)

  // Suggested states: intersection of trial states and states with members
  const suggestedStates = trialStates.filter(state => statesWithMembers.includes(state))

  // Load members and notified list when dialog opens or filter changes
  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      const [membersResult, notifiedResult] = await Promise.all([
        getMembersForNotification({ states: filterState ? [filterState] : undefined }),
        getNotifiedMembersForTrial(trial.nct_id),
      ])

      if (membersResult.success) {
        setMembers(membersResult.data)
      } else {
        setError(membersResult.error)
      }

      if (notifiedResult.success) {
        setNotifiedIds(notifiedResult.data)
      }

      setIsLoading(false)
    }

    loadData()
  }, [open, filterState, trial.nct_id])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set())
      setCustomMessage("")
      setSuccess(null)
      setError(null)
    }
  }, [open])

  const toggleMember = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    const selectableMembers = members.filter(m => !notifiedIds.includes(m.id))
    setSelectedIds(new Set(selectableMembers.map(m => m.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      setError("Selecione pelo menos um membro")
      return
    }

    setIsSending(true)
    setError(null)

    const result = await notifyMembersAboutTrial({
      nct_id: trial.nct_id,
      trial_title: trial.title,
      member_ids: Array.from(selectedIds),
      custom_message: customMessage || undefined,
    })

    if (result.success) {
      setSuccess(`${result.sent_count} membro(s) notificado(s) com sucesso!`)
      setSelectedIds(new Set())
      // Refresh notified list
      const notifiedResult = await getNotifiedMembersForTrial(trial.nct_id)
      if (notifiedResult.success) {
        setNotifiedIds(notifiedResult.data)
      }
    } else {
      setError(result.error || "Erro ao enviar notificações")
    }

    setIsSending(false)
  }

  const selectableMembers = members.filter(m => !notifiedIds.includes(m.id))
  const allSelected = selectableMembers.length > 0 && selectableMembers.every(m => selectedIds.has(m.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            <Users className="inline h-5 w-5 mr-2 text-primary" />
            Notificar Membros
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Selecione os membros para notificar sobre este estudo clínico
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Trial Info */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="font-medium text-primary text-sm">{trial.nct_id}</p>
            <p className="text-white/80 text-sm line-clamp-2">{trial.title}</p>
            {brazilLocations.length > 0 && (
              <p className="text-xs text-white/50 mt-1">
                <MapPin className="inline h-3 w-3 mr-1" />
                {brazilLocations.map(l => l.city).join(", ")}
              </p>
            )}
          </div>

          {/* Suggested States */}
          {suggestedStates.length > 0 && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-sm text-green-400 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Estados com membros próximos ao estudo:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedStates.map(state => (
                  <button
                    key={state}
                    onClick={() => setFilterState(state)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      filterState === state
                        ? "bg-green-500/30 border-green-500/50 text-green-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-white/70 text-sm">Filtrar por Estado</Label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estados</SelectItem>
                  {statesWithMembers.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? deselectAll : selectAll}
                className="text-white/60"
                disabled={selectableMembers.length === 0}
              >
                {allSelected ? (
                  <>
                    <Square className="h-4 w-4 mr-1" />
                    Desmarcar
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Selecionar Todos
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10">
              <p className="text-sm text-white/60">
                {members.length} membro(s) encontrado(s)
                {selectedIds.size > 0 && ` • ${selectedIds.size} selecionado(s)`}
              </p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-white/50 mt-2">Carregando membros...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-white/50">
                Nenhum membro encontrado
                {filterState && " para este estado"}
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {members.map(member => {
                  const isNotified = notifiedIds.includes(member.id)
                  const isSelected = selectedIds.has(member.id)

                  return (
                    <div
                      key={member.id}
                      onClick={() => !isNotified && toggleMember(member.id)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isNotified
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-white/5"
                      } ${isSelected ? "bg-primary/10" : ""}`}
                    >
                      <div className="flex-shrink-0">
                        {isNotified ? (
                          <div className="w-5 h-5 rounded bg-gray-500/30 flex items-center justify-center">
                            <Check className="h-3 w-3 text-gray-400" />
                          </div>
                        ) : isSelected ? (
                          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-white/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.display_name}</p>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          {member.city && member.state && (
                            <span>
                              <MapPin className="inline h-3 w-3 mr-0.5" />
                              {member.city}, {member.state}
                            </span>
                          )}
                          {member.injury_level && (
                            <span className="px-1.5 py-0.5 rounded bg-white/10">
                              {member.injury_level}
                            </span>
                          )}
                          {member.asia_scale && (
                            <span className="px-1.5 py-0.5 rounded bg-white/10">
                              ASIA {member.asia_scale}
                            </span>
                          )}
                        </div>
                      </div>
                      {isNotified && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          Já notificado
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Custom Message */}
          <div>
            <Label className="text-white/70 text-sm">Mensagem Personalizada (opcional)</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Adicione uma mensagem personalizada para os membros..."
              className="bg-white/5 border-white/10 mt-1 min-h-[80px]"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <Check className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/60"
            >
              Fechar
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || selectedIds.size === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Notificar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
