"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import {
  saveProfile,
  checkUsernameAvailability,
  suggestUsername,
} from "./actions"
import type {
  ProfileFormData,
  GenderType,
  CommunicationPreference,
  AsiaScale,
} from "./types"
import { useTranslations } from "next-intl"

// Brazilian states - defined here since server action files can't export constants to client components
const BRAZILIAN_STATES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO"
] as const
import {
  User, Phone, MapPin, Calendar, Heart, Globe, Loader2, Check, X, Sparkles, FileText
} from "lucide-react"

interface Profile {
  id: string
  display_name: string
  bio: string | null
  bio_public: boolean | null
  user_type: string
  username: string | null
  phone: string | null
  gender: GenderType | null
  preferred_communication: CommunicationPreference | null
  city: string | null
  state: string | null
  cep: string | null
  date_of_birth: string | null
  injury_date: string | null
  injury_acquired: boolean | null
  asia_scale: AsiaScale | null
  asia_recent_evaluation: boolean | null
  injury_level: string | null
  pix_key: string | null
  profile_picture_url: string | null
  profile_public: boolean
  profile_completed: boolean
}

interface ProfileFormProps {
  profile: Profile
  userEmail: string
  isMember: boolean
}

export function ProfileForm({ profile, userEmail, isMember }: ProfileFormProps) {
  const t = useTranslations("profilePage")

  const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
    { value: "feminino", label: t("genderFemale") },
    { value: "masculino", label: t("genderMale") },
    { value: "nao_binario", label: t("genderNonBinary") },
    { value: "prefiro_nao_informar", label: t("genderPreferNotToSay") },
  ]

  const COMMUNICATION_OPTIONS: { value: CommunicationPreference; label: string }[] = [
    { value: "email", label: t("commEmail") },
    { value: "whatsapp", label: t("commWhatsapp") },
    { value: "sms", label: t("commSms") },
    { value: "telefone", label: t("commPhone") },
  ]

  const ASIA_OPTIONS: { value: AsiaScale; label: string }[] = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
    { value: "nao_sei", label: t("asiaDontKnow") },
  ]
  const [formData, setFormData] = useState<ProfileFormData>({
    username: profile.username || "",
    phone: profile.phone || "",
    gender: profile.gender,
    preferred_communication: profile.preferred_communication,
    city: profile.city || "",
    state: profile.state || "",
    cep: profile.cep || "",
    date_of_birth: profile.date_of_birth || "",
    injury_date: profile.injury_date || "",
    injury_acquired: profile.injury_acquired,
    asia_scale: profile.asia_scale,
    asia_recent_evaluation: profile.asia_recent_evaluation,
    injury_level: profile.injury_level || "",
    pix_key: profile.pix_key || "",
    profile_picture_url: profile.profile_picture_url || "",
    profile_public: profile.profile_public || false,
    bio: profile.bio || "",
    bio_public: profile.bio_public || false,
  })

  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean
    available: boolean | null
    message?: string
  }>({ checking: false, available: null })

  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{
    success?: boolean
    error?: string
    pointsAwarded?: number
  } | null>(null)

  // Check username availability with debounce
  useEffect(() => {
    if (!formData.username) {
      setUsernameStatus({ checking: false, available: null })
      return
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null })
      const result = await checkUsernameAvailability(formData.username, profile.id)
      setUsernameStatus({
        checking: false,
        available: result.available,
        message: result.message,
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.username, profile.id])

  // Suggest username on mount if empty
  useEffect(() => {
    if (!formData.username && profile.display_name) {
      suggestUsername(profile.display_name, profile.id).then((suggestion) => {
        setFormData((prev) => ({ ...prev, username: suggestion }))
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveResult(null)

    const result = await saveProfile(formData)
    setSaveResult(result)
    setIsSaving(false)

    if (result.success) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaveResult(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Success/Error Message */}
      {saveResult && (
        <div
          className={`rounded-2xl p-5 ${
            saveResult.success
              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
              : "bg-red-500/20 border border-red-500/30"
          }`}
        >
          {saveResult.success ? (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/30">
                  <Check className="h-5 w-5" />
                </div>
                <span className="font-medium">{t("savedSuccess")}</span>
              </div>
              {(saveResult.pointsAwarded ?? 0) > 0 && (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-orange-500/30 border border-yellow-400/50 shadow-lg shadow-yellow-500/20">
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                  <span className="font-bold text-lg bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                    {t("pointsAwarded", { points: saveResult.pointsAwarded })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/30">
                <X className="h-5 w-5" />
              </div>
              <span className="font-medium">{saveResult.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Profile Picture */}
      <section className="glass-strong p-6 sm:p-8 rounded-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("profilePicture")}
        </h2>
        <ProfilePictureUpload
          currentImageUrl={formData.profile_picture_url}
          userId={profile.id}
          onUploadComplete={(url) => updateField("profile_picture_url", url)}
        />
      </section>

      {/* Username */}
      <section className="glass-strong p-6 sm:p-8 rounded-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t("username")}
        </h2>
        <div className="space-y-2">
          <Label htmlFor="username">{t("publicProfileUrl")}</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{t("urlPrefix")}</span>
            <div className="relative flex-1">
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value.toLowerCase())}
                placeholder={t("usernamePlaceholder")}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus.checking ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : usernameStatus.available === true ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : usernameStatus.available === false ? (
                  <X className="h-4 w-4 text-red-400" />
                ) : null}
              </div>
            </div>
          </div>
          {usernameStatus.message && (
            <p className={`text-sm ${usernameStatus.available ? "text-emerald-400" : "text-red-400"}`}>
              {usernameStatus.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("usernameHint")}
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="glass-strong p-6 sm:p-8 rounded-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          {t("contactInfo")}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gender */}
          <div className="space-y-2">
            <Label>{t("gender")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("gender", option.value)}
                  className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                    formData.gender === option.value
                      ? "border-primary bg-primary/20"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder={t("phonePlaceholder")}
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input value={userEmail} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">{t("emailCannotChange")}</p>
          </div>

          {/* Preferred Communication */}
          <div className="space-y-2">
            <Label>{t("preferredCommunication")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMUNICATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("preferred_communication", option.value)}
                  className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                    formData.preferred_communication === option.value
                      ? "border-primary bg-primary/20"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="glass-strong p-6 sm:p-8 rounded-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t("location")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">{t("city")}</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder={t("cityPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">{t("state")}</Label>
            <select
              id="state"
              value={formData.state}
              onChange={(e) => updateField("state", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">{t("stateSelect")}</option>
              {BRAZILIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">{t("cep")}</Label>
            <Input
              id="cep"
              value={formData.cep}
              onChange={(e) => updateField("cep", e.target.value)}
              placeholder={t("cepPlaceholder")}
            />
          </div>
        </div>
      </section>

      {/* Personal */}
      <section className="glass-strong p-6 sm:p-8 rounded-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t("personalInfo")}
        </h2>
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="date_of_birth">{t("dateOfBirth")}</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ""}
            onChange={(e) => updateField("date_of_birth", e.target.value || null)}
          />
        </div>
      </section>

      {/* Bio Section */}
      <section className="glass-strong p-6 sm:p-8 rounded-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("aboutYou")}
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder={t("bioPlaceholder")}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {t("bioHint")}
            </p>
          </div>

          {/* Bio Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg glass">
            <div>
              <Label>{t("bioPublic")}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t("bioPublicHint")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateField("bio_public", !formData.bio_public)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.bio_public ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.bio_public ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Medical Info (Members only) */}
      {isMember && (
        <section className="glass-strong p-6 sm:p-8 rounded-3xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5" />
            {t("medicalInfo")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t("medicalInfoHint")}
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Injury Date */}
            <div className="space-y-2">
              <Label htmlFor="injury_date">{t("injuryDate")}</Label>
              <Input
                id="injury_date"
                type="date"
                value={formData.injury_date || ""}
                onChange={(e) => updateField("injury_date", e.target.value || null)}
              />
              <p className="text-xs text-muted-foreground">{t("injuryDateHint")}</p>
            </div>

            {/* Injury Level */}
            <div className="space-y-2">
              <Label htmlFor="injury_level">{t("injuryLevel")}</Label>
              <Input
                id="injury_level"
                value={formData.injury_level}
                onChange={(e) => updateField("injury_level", e.target.value)}
                placeholder={t("injuryLevelPlaceholder")}
              />
            </div>

            {/* Acquired Injury */}
            <div className="space-y-2">
              <Label>{t("injuryAcquired")}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {t("injuryAcquiredHint")}
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => updateField("injury_acquired", true)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    formData.injury_acquired === true
                      ? "border-primary bg-primary/20"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {t("yes")}
                </button>
                <button
                  type="button"
                  onClick={() => updateField("injury_acquired", false)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    formData.injury_acquired === false
                      ? "border-primary bg-primary/20"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {t("no")}
                </button>
              </div>
            </div>

            {/* ASIA Scale */}
            <div className="space-y-2">
              <Label>{t("asiaScale")}</Label>
              <div className="flex flex-wrap gap-2">
                {ASIA_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("asia_scale", option.value)}
                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                      formData.asia_scale === option.value
                        ? "border-primary bg-primary/20"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent ASIA Evaluation */}
            <div className="space-y-2 md:col-span-2">
              <Label>{t("asiaRecentEvaluation")}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {t("asiaRecentEvaluationHint")}
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => updateField("asia_recent_evaluation", true)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    formData.asia_recent_evaluation === true
                      ? "border-primary bg-primary/20"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {t("yes")}
                </button>
                <button
                  type="button"
                  onClick={() => updateField("asia_recent_evaluation", false)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    formData.asia_recent_evaluation === false
                      ? "border-primary bg-primary/20"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {t("no")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Public Profile Settings */}
      <section className="glass-strong p-6 sm:p-8 rounded-3xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t("publicProfile")}
        </h2>
        <div className="space-y-6">
          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg glass">
            <div>
              <Label>{t("makeProfilePublic")}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t("publicProfileHint", { username: formData.username || t("usernamePlaceholder") })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateField("profile_public", !formData.profile_public)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.profile_public ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.profile_public ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isSaving || usernameStatus.available === false}
          className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 px-8"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("saving")}
            </>
          ) : (
            t("saveProfile")
          )}
        </Button>
      </div>
    </form>
  )
}
