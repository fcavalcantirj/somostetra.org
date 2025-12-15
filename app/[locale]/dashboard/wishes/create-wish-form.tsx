"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createWish } from "./actions"
import { useTranslations } from "next-intl"

export function CreateWishForm() {
  const t = useTranslations("createWish")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    // Set sessionStorage BEFORE calling createWish (to avoid race condition with revalidatePath)
    sessionStorage.setItem("wishJustCreated", "true")

    const result = await createWish(content)

    if (result.success) {
      setContent("")
      setSuccess(true)
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } else {
      // Clear flag if creation failed
      sessionStorage.removeItem("wishJustCreated")
      setError(result.error || t("errorDefault"))
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wish-content">{t("label")}</Label>
        <Textarea
          id="wish-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("placeholder")}
          rows={4}
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {t("characters", { count: content.length })}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-lg">
          ✓ {t("successMessage")}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="gradient-primary font-bold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {t("submit")}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
