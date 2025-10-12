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
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { trackVoteCreated } from "@/lib/analytics"

export function CreateVoteForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)
    const supabase = createClient()

    console.log("[v0] Starting vote creation...", { title, category })

    try {
      const { data, error } = await supabase
        .from("votes")
        .insert({
          title,
          description,
          category,
          created_by: userId,
          status: "active",
        })
        .select()
        .single()

      console.log("[v0] Vote creation result:", { data, error })

      if (error) throw error

      trackVoteCreated(data.id, title, category)

      console.log("[v0] Showing success toast...")
      toast({
        title: "Votação criada com sucesso!",
        description: "Sua votação foi publicada e está disponível para a comunidade.",
      })

      setIsLoading(false)

      console.log("[v0] Redirecting to vote page...")
      router.push(`/votes/${data.id}`)
      router.refresh()
    } catch (error: unknown) {
      console.log("[v0] Error creating vote:", error)
      toast({
        title: "Erro ao criar votação",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
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
            "Criando..."
          ) : (
            <>
              <Plus className="w-6 h-6 mr-2" />
              Criar Votação
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
