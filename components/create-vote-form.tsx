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

export function CreateVoteForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("votes").insert({
        title,
        description,
        category,
        created_by: userId,
        status: "active",
      })

      if (error) throw error

      router.push("/votes")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar votação")
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
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-lg font-bold">
            Categoria
          </Label>
          <Select value={category} onValueChange={setCategory} required>
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

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">{error}</p>}

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
