"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Vote {
  id: string
  title: string
  description: string
  category: string
  status: string
}

export function EditVoteForm({ vote }: { vote: Vote }) {
  const [title, setTitle] = useState(vote.title)
  const [description, setDescription] = useState(vote.description)
  const [category, setCategory] = useState(vote.category)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("votes")
        .update({
          title,
          description,
          category,
        })
        .eq("id", vote.id)

      if (error) throw error

      toast({
        title: "Votação atualizada com sucesso!",
        description: "As alterações foram salvas.",
      })

      router.push("/admin/votes")
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: "Erro ao atualizar votação",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-strong p-10 rounded-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-lg font-bold">
            Título da Votação
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Ex: Devemos criar um programa de mentoria?"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 h-14 text-lg"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-lg font-bold">
            Descrição
          </Label>
          <Textarea
            id="description"
            placeholder="Explique a proposta em detalhes..."
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 min-h-32 text-lg"
            rows={5}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-lg font-bold">
            Categoria
          </Label>
          <Select value={category} onValueChange={setCategory} required disabled={isLoading}>
            <SelectTrigger className="mt-2 h-14 text-lg">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Acessibilidade">Acessibilidade</SelectItem>
              <SelectItem value="Tecnologia">Tecnologia</SelectItem>
              <SelectItem value="Direitos">Direitos</SelectItem>
              <SelectItem value="Saúde">Saúde</SelectItem>
              <SelectItem value="Comunidade">Comunidade</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" size="lg" className="w-full gradient-primary font-bold h-16 text-lg" disabled={isLoading}>
          {isLoading ? (
            "Salvando..."
          ) : (
            <>
              <Save className="w-6 h-6 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
