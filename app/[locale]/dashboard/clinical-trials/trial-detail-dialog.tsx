"use client"

import { ExternalLink, MapPin, Users, Calendar, Building2, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Trial } from "./actions"
import { useTranslations } from "next-intl"

interface TrialDetailDialogProps {
  trial: Trial
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "RECRUITING":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
    case "NOT_YET_RECRUITING":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
    case "ACTIVE_NOT_RECRUITING":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
    case "COMPLETED":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30"
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30"
  }
}

export function TrialDetailDialog({ trial, open, onOpenChange }: TrialDetailDialogProps) {
  const t = useTranslations("trialDetail")
  const tStatus = useTranslations("trialStatus")
  const brazilLocations = (trial.locations || []).filter(loc => loc.country === "Brazil")
  const otherLocations = (trial.locations || []).filter(loc => loc.country !== "Brazil")

  const getGoogleMapsUrl = (city: string, country: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${city}, ${country}`)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(trial.status)}`}>
                  {tStatus(trial.status)}
                </span>
                {trial.phase && trial.phase.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    {trial.phase.join(", ")}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-bold leading-tight">
                {trial.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{trial.nct_id}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Brief Summary */}
          {trial.brief_summary && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("summary")}
              </h4>
              <p className="text-foreground text-sm leading-relaxed">
                {trial.brief_summary}
              </p>
            </div>
          )}

          {/* Detailed Summary */}
          {trial.detailed_summary && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("detailedDescription")}
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {trial.detailed_summary}
              </p>
            </div>
          )}

          {/* Conditions */}
          {trial.conditions && trial.conditions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("conditions")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {trial.conditions.map((condition, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-md text-xs bg-primary/10 text-primary border border-primary/30"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sponsor */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Building2 className="inline h-4 w-4 mr-1" />
              {t("sponsor")}
            </h4>
            <div className="bg-muted rounded-lg p-3 border border-border">
              <p className="font-medium">{trial.sponsor.name}</p>
              <p className="text-sm text-muted-foreground">
                {trial.sponsor.type}
                {trial.sponsor.category && ` • ${trial.sponsor.category}`}
              </p>
            </div>
          </div>

          {/* Eligibility */}
          {trial.eligibility && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                {t("eligibilityCriteria")}
              </h4>
              <div className="bg-muted rounded-lg p-4 border border-border space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("minimumAge")}</p>
                    <p className="font-medium">{trial.eligibility.minimum_age || t("notSpecified")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("maximumAge")}</p>
                    <p className="font-medium">{trial.eligibility.maximum_age || t("notSpecified")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("gender")}</p>
                    <p className="font-medium">
                      {trial.eligibility.gender === "ALL" ? t("all") : trial.eligibility.gender}
                    </p>
                  </div>
                </div>
                {trial.eligibility.criteria && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-muted-foreground text-xs mb-2">{t("detailedCriteria")}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {trial.eligibility.criteria}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              {t("studyPeriod")}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-muted-foreground text-xs">{t("startDate")}</p>
                <p className="font-medium">{trial.start_date || t("notProvided")}</p>
              </div>
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-muted-foreground text-xs">{t("expectedCompletion")}</p>
                <p className="font-medium">{trial.completion_date || t("notProvided")}</p>
              </div>
            </div>
          </div>

          {/* Brazil Locations */}
          {brazilLocations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                {t("brazilLocations", { count: brazilLocations.length })}
              </h4>
              <div className="space-y-2">
                {brazilLocations.map((loc, idx) => (
                  <a
                    key={idx}
                    href={getGoogleMapsUrl(loc.city, loc.country)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">{loc.city}</p>
                      <p className="text-sm text-muted-foreground">
                        {loc.state && `${loc.state}, `}{loc.country}
                        {loc.zip_code && ` - ${loc.zip_code}`}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-green-600/50 dark:text-green-400/50" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Other Locations */}
          {otherLocations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                {t("otherLocations", { count: otherLocations.length })}
              </h4>
              <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {otherLocations.map((loc, idx) => (
                  <a
                    key={idx}
                    href={getGoogleMapsUrl(loc.city, loc.country)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors text-sm"
                  >
                    <div>
                      <p className="font-medium">{loc.city}</p>
                      <p className="text-xs text-muted-foreground">
                        {loc.state && `${loc.state}, `}{loc.country}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          {trial.contacts && trial.contacts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("contacts")}
              </h4>
              <div className="space-y-2">
                {trial.contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-muted border border-border"
                  >
                    {contact.name && <p className="font-medium">{contact.name}</p>}
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-foreground">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              {t("close")}
            </Button>
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
            >
              {t("viewOnClinicalTrials")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
