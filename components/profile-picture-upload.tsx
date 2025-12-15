"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  userId: string
  onUploadComplete: (url: string) => void
  onError?: (error: string) => void
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"]

export function ProfilePictureUpload({
  currentImageUrl,
  userId,
  onUploadComplete,
  onError,
}: ProfilePictureUploadProps) {
  const t = useTranslations("profilePicture")
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t("invalidFormat")
    }
    if (file.size > MAX_FILE_SIZE) {
      return t("fileTooLarge")
    }
    return null
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      onError?.(validationError)
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const filePath = `${userId}/${userId}.${fileExt}`

      // Delete existing file if any
      await supabase.storage.from("profile-pictures").remove([filePath])

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath)

      onUploadComplete(urlData.publicUrl)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("uploadError")
      setError(errorMessage)
      onError?.(errorMessage)
      setPreview(currentImageUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentImageUrl) return

    setIsUploading(true)
    try {
      const supabase = createClient()

      // Extract file path from URL
      const urlParts = currentImageUrl.split("/profile-pictures/")
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage.from("profile-pictures").remove([filePath])
      }

      setPreview(null)
      onUploadComplete("")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("removeError")
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt={t("alt")}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-white/40" />
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>
        {preview && !isUploading && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title={t("removeTitle")}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="border-white/20 hover:bg-white/10"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("uploading")}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {preview ? t("changePhoto") : t("uploadPhoto")}
          </>
        )}
      </Button>

      {/* Help text */}
      <p className="text-xs text-white/40 text-center">
        {t("helpText")}
      </p>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}
