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
import { useTranslations } from "next-intl"

export function CreateVoteForm({ userId }: { userId: string }) {
  const t = useTranslations("createVoteForm")
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
        title: t("successTitle"),
        description: t("successDescription"),
      })

      setIsLoading(false)

      console.log("[v0] Redirecting to vote page...")
      router.push(`/votes/${data.id}`)
      router.refresh()
    } catch (error: unknown) {
      console.log("[v0] Error creating vote:", error)
      toast({
        title: t("errorTitle"),
        description: error instanceof Error ? error.message : t("errorDescription"),
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
            {t("titleLabel")}
          </Label>
          <Input
            id="title"
            type="text"
            placeholder={t("titlePlaceholder")}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 h-14 text-lg"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-lg font-bold">
            {t("descriptionLabel")}
          </Label>
          <Textarea
            id="description"
            placeholder={t("descriptionPlaceholder")}
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
            {t("categoryLabel")}
          </Label>
          <Select value={category} onValueChange={setCategory} required disabled={isLoading}>
            <SelectTrigger className="mt-2 h-14 text-lg">
              <SelectValue placeholder={t("categoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Acessibilidade">{t("categories.accessibility")}</SelectItem>
              <SelectItem value="Tecnologia">{t("categories.technology")}</SelectItem>
              <SelectItem value="Direitos">{t("categories.rights")}</SelectItem>
              <SelectItem value="Saúde">{t("categories.health")}</SelectItem>
              <SelectItem value="Comunidade">{t("categories.community")}</SelectItem>
              <SelectItem value="Outro">{t("categories.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" size="lg" className="w-full gradient-primary font-bold h-16 text-lg" disabled={isLoading}>
          {isLoading ? (
            t("creating")
          ) : (
            <>
              <Plus className="w-6 h-6 mr-2" />
              {t("createVote")}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
