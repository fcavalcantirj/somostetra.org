"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { deleteSupporter } from "../actions"
import { useToast } from "@/hooks/use-toast"

interface DeleteSupporterButtonProps {
  supporterId: string
  supporterName: string
}

export function DeleteSupporterButton({ supporterId, supporterName }: DeleteSupporterButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja deletar ${supporterName}? Esta ação não pode ser desfeita.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await deleteSupporter(supporterId)

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sucesso",
          description: `${supporterName} foi deletado com sucesso!`,
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar apoiador",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
      title="Deletar apoiador"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
