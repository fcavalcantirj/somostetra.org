"use client"

import { useState } from "react"
import { Gift, Trash2, Edit2, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { WISH_STATUS_COLORS, type WishStatus } from "./types"
import { deleteWish, updateWish } from "./actions"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"

interface WishCategory {
  id: string
  name: string
  icon: string
}

interface Wish {
  id: string
  content: string
  status: WishStatus
  category_id: string | null
  fulfilled_at: string | null
  fulfiller_name: string | null
  fulfilled_notes: string | null
  created_at: string
  wish_categories: WishCategory | null
}

interface WishListProps {
  wishes: Wish[]
}

export function WishList({ wishes }: WishListProps) {
  const t = useTranslations("wishList")
  const tStatus = useTranslations("wishStatus")
  const locale = useLocale()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR")
  }

  const handleEdit = (wish: Wish) => {
    setEditingId(wish.id)
    setEditContent(wish.content)
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
    setError(null)
  }

  const handleSaveEdit = async (wishId: string) => {
    setIsUpdating(true)
    setError(null)

    const result = await updateWish(wishId, editContent)

    if (result.success) {
      setEditingId(null)
      setEditContent("")
    } else {
      setError(result.error || t("errorUpdate"))
    }

    setIsUpdating(false)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(deleteConfirmId)
    setDeleteConfirmId(null)
    setError(null)

    const result = await deleteWish(deleteConfirmId)

    if (!result.success) {
      setError(result.error || t("errorDelete"))
    }

    setIsDeleting(null)
  }

  if (wishes.length === 0) {
    return (
      <div className="glass-strong p-12 rounded-3xl text-center">
        <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold mb-2">{t("noWishes")}</h3>
        <p className="text-muted-foreground">
          {t("noWishesDescription")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("yourWishes")}</h2>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {wishes.map((wish) => {
          const statusColor = WISH_STATUS_COLORS[wish.status]
          const statusLabel = tStatus(wish.status)
          const isPending = wish.status === "pending"
          const isEditing = editingId === wish.id

          return (
            <div
              key={wish.id}
              className="glass-strong p-6 rounded-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {wish.wish_categories ? (
                    <span className="text-2xl">{wish.wish_categories.icon}</span>
                  ) : (
                    <Gift className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Actions for pending wishes */}
                {isPending && !isEditing && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(wish)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(wish.id)}
                      disabled={isDeleting === wish.id}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      {isDeleting === wish.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Content */}
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full"
                    placeholder={t("editPlaceholder")}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(wish.id)}
                      disabled={isUpdating}
                      className="gradient-primary"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {t("save")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-lg">{wish.content}</p>
              )}

              {/* Fulfillment info */}
              {wish.status === "fulfilled" && wish.fulfilled_at && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <p className="text-sm font-bold text-blue-400">
                    {t("fulfilledOn", { date: formatDate(wish.fulfilled_at) })}
                  </p>
                  {wish.fulfiller_name && (
                    <p className="text-sm text-muted-foreground">
                      {t("fulfilledBy", { name: wish.fulfiller_name })}
                    </p>
                  )}
                  {wish.fulfilled_notes && (
                    <p className="text-sm text-muted-foreground">
                      {wish.fulfilled_notes}
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-muted-foreground">
                {t("createdOn", { date: formatDate(wish.created_at) })}
              </p>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
