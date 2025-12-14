"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWishCategory, updateWishCategory, deleteWishCategory } from "@/app/admin/actions"

interface WishCategory {
  id: string
  name: string
  icon: string
  description: string | null
  is_active: boolean
  created_at: string
}

interface WishCategoriesClientProps {
  categories: WishCategory[]
}

export function WishCategoriesClient({ categories: initialCategories }: WishCategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
  })

  const resetForm = () => {
    setFormData({ name: "", icon: "", description: "" })
    setIsCreating(false)
    setEditingId(null)
    setError(null)
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.icon) {
      setError("Nome e ícone são obrigatórios")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createWishCategory(formData.name, formData.icon, formData.description || null)

    if (result.success && result.category) {
      setCategories([...categories, result.category])
      resetForm()
    } else {
      setError(result.error || "Erro ao criar categoria")
    }

    setIsSubmitting(false)
  }

  const handleEdit = (category: WishCategory) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      icon: category.icon,
      description: category.description || "",
    })
    setIsCreating(false)
  }

  const handleUpdate = async () => {
    if (!editingId || !formData.name || !formData.icon) {
      setError("Nome e ícone são obrigatórios")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await updateWishCategory(
      editingId,
      formData.name,
      formData.icon,
      formData.description || null
    )

    if (result.success) {
      setCategories(categories.map(c =>
        c.id === editingId
          ? { ...c, name: formData.name, icon: formData.icon, description: formData.description || null }
          : c
      ))
      resetForm()
    } else {
      setError(result.error || "Erro ao atualizar categoria")
    }

    setIsSubmitting(false)
  }

  const handleToggleActive = async (category: WishCategory) => {
    setIsSubmitting(true)

    const result = await updateWishCategory(
      category.id,
      category.name,
      category.icon,
      category.description,
      !category.is_active
    )

    if (result.success) {
      setCategories(categories.map(c =>
        c.id === category.id ? { ...c, is_active: !c.is_active } : c
      ))
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Desejos com esta categoria ficarão sem categoria.")) return

    setIsSubmitting(true)

    const result = await deleteWishCategory(categoryId)

    if (result.success) {
      setCategories(categories.filter(c => c.id !== categoryId))
    } else {
      setError(result.error || "Erro ao excluir categoria")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Create Button */}
      {!isCreating && !editingId && (
        <Button
          onClick={() => { setIsCreating(true); setError(null) }}
          className="mb-6 bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="text-lg font-bold mb-4">
            {isCreating ? "Nova Categoria" : "Editar Categoria"}
          </h3>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cadeira de Rodas"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone (emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ex: 🦽"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={isCreating ? handleCreate : handleUpdate}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {isCreating ? "Criar" : "Salvar"}
            </Button>
            <Button
              variant="ghost"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`p-4 rounded-xl border transition-colors ${
              category.is_active
                ? "border-white/10 bg-white/5"
                : "border-white/5 bg-white/[0.02] opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{category.icon}</span>
                <div>
                  <p className="font-semibold">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-white/60">{category.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(category)}
                  disabled={isSubmitting}
                  className={category.is_active ? "text-green-400" : "text-white/40"}
                >
                  {category.is_active ? "Ativa" : "Inativa"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12 text-white/40">
            Nenhuma categoria cadastrada
          </div>
        )}
      </div>
    </div>
  )
}
