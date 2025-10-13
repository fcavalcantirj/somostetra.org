"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { convertSupporterToMember } from "../actions"
import { toast } from "@/hooks/use-toast"

interface ConvertSupporterButtonProps {
  supporterId: string
  supporterName: string
  hasAuthUser: boolean
}

export function ConvertSupporterButton({ supporterId, supporterName, hasAuthUser }: ConvertSupporterButtonProps) {
  const [isConverting, setIsConverting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  if (!hasAuthUser) {
    return (
      <span className="text-xs text-white/40" title="Apoiador não possui conta de autenticação">
        Sem conta
      </span>
    )
  }

  const handleConvert = async () => {
    setIsConverting(true)
    try {
      const result = await convertSupporterToMember(supporterId)
      if (result.error) {
        toast({
          title: "Erro ao converter",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Conversão concluída",
          description: `${supporterName} foi convertido para membro com sucesso!`,
        })
        setShowConfirm(false)
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error converting supporter:", error)
      toast({
        title: "Erro",
        description: "Erro ao converter apoiador",
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleConvert}
          disabled={isConverting}
          className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/30 disabled:opacity-50"
        >
          {isConverting ? "Convertendo..." : "Confirmar"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isConverting}
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
    >
      <UserPlus className="h-3.5 w-3.5" />
      Converter para Membro
    </button>
  )
}
