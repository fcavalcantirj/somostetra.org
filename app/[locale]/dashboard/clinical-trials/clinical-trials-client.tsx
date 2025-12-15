"use client"

import { useState, useMemo } from "react"
import { Search, Loader2, MapPin, Calendar, Users, ExternalLink, ChevronDown, ChevronUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { searchClinicalTrials, saveSearchQuery, type Trial, type SearchFilters } from "./actions"
import { TrialDetailDialog } from "./trial-detail-dialog"
import { useTranslations } from "next-intl"

interface ClinicalTrialsClientProps {
  initialTrials: Trial[]
  initialTotalCount: number
}

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

// Brazilian state coordinates for location search
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  SP: { lat: -23.5505, lng: -46.6333 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  MG: { lat: -19.9167, lng: -43.9345 },
  RS: { lat: -30.0346, lng: -51.2177 },
  PR: { lat: -25.4284, lng: -49.2733 },
  BA: { lat: -12.9714, lng: -38.5014 },
  PE: { lat: -8.0476, lng: -34.8770 },
  CE: { lat: -3.7172, lng: -38.5433 },
  DF: { lat: -15.7942, lng: -47.8822 },
  GO: { lat: -16.6869, lng: -49.2648 },
}

export function ClinicalTrialsClient({
  initialTrials,
  initialTotalCount,
}: ClinicalTrialsClientProps) {
  const t = useTranslations("clinicalTrialsPage")
  const [trials, setTrials] = useState<Trial[]>(initialTrials)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const STATUS_OPTIONS = [
    { value: "RECRUITING", label: t("statusRecruiting") },
    { value: "NOT_YET_RECRUITING", label: t("statusNotYetRecruiting") },
    { value: "ACTIVE_NOT_RECRUITING", label: t("statusActiveNotRecruiting") },
    { value: "COMPLETED", label: t("statusCompleted") },
  ]

  const PHASE_OPTIONS = [
    { value: "EARLY_PHASE1", label: t("phase0") },
    { value: "PHASE1", label: t("phase1") },
    { value: "PHASE2", label: t("phase2") },
    { value: "PHASE3", label: t("phase3") },
    { value: "PHASE4", label: t("phase4") },
    { value: "NA", label: t("phaseNA") },
  ]

  // Filters (English - ClinicalTrials.gov uses EN)
  const [conditions, setConditions] = useState("tetraplegia, quadriplegia, tetraparesis, quadriparesis, spinal cord injury")
  const [status, setStatus] = useState<string[]>(["RECRUITING"])
  const [phase, setPhase] = useState<string[]>([])
  const [locationState, setLocationState] = useState<string>("")
  const [distance, setDistance] = useState<number>(500)

  // Quick filter
  const [filterBrazilOnly, setFilterBrazilOnly] = useState(false)

  // Dialogs
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null)

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)
    setFilterBrazilOnly(false)

    const filters: SearchFilters = {
      conditions: conditions.split(",").map(c => c.trim()).filter(Boolean),
      status: status.length > 0 ? status : ["RECRUITING"],
      phase: phase.length > 0 ? phase : undefined,
      page_size: 50,
    }

    // Add location if state selected
    if (locationState && STATE_COORDS[locationState]) {
      filters.latitude = STATE_COORDS[locationState].lat
      filters.longitude = STATE_COORDS[locationState].lng
      filters.distance = distance
    }

    const result = await searchClinicalTrials(filters)

    if (result.success) {
      setTrials(result.data.trials)
      setTotalCount(result.data.total_count)

      // Save search query for analytics (fire and forget)
      saveSearchQuery({
        conditions: filters.conditions || [],
        status: filters.status,
        phase: filters.phase,
        locationState: locationState || undefined,
        distance: locationState ? distance : undefined,
        brazilOnly: false,
        resultsCount: result.data.total_count,
      })
    } else {
      setError(result.error)
    }

    setIsLoading(false)
  }

  const handleBrazilFilter = async () => {
    if (!filterBrazilOnly) {
      // Fetch Brazil trials from API
      setIsLoading(true)
      const conditionsArray = conditions.split(",").map(c => c.trim()).filter(Boolean)
      const result = await searchClinicalTrials({
        conditions: conditionsArray,
        status: status.length > 0 ? status : ["RECRUITING"],
        phase: phase.length > 0 ? phase : undefined,
        latitude: -23.5505,  // São Paulo
        longitude: -46.6333,
        distance: 3000,  // Cover all of Brazil
        page_size: 50,
      })
      if (result.success) {
        setTrials(result.data.trials)
        setTotalCount(result.data.total_count)
        setFilterBrazilOnly(true)

        // Save search query for analytics (fire and forget)
        saveSearchQuery({
          conditions: conditionsArray,
          status: status.length > 0 ? status : ["RECRUITING"],
          phase: phase.length > 0 ? phase : undefined,
          brazilOnly: true,
          resultsCount: result.data.total_count,
        })
      }
      setIsLoading(false)
    } else {
      // Reset to default search
      handleSearch()
    }
  }

  const toggleStatus = (value: string) => {
    setStatus(prev =>
      prev.includes(value)
        ? prev.filter(s => s !== value)
        : [...prev, value]
    )
  }

  const togglePhase = (value: string) => {
    setPhase(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    )
  }

  const getStatusBadgeColor = (status: string) => {
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

  const getBrazilLocations = (trial: Trial) => {
    return (trial.locations || []).filter(loc => loc.country === "Brazil")
  }

  // Sort trials: Brazil first
  const displayTrials = useMemo(() => {
    return [...trials].sort((a, b) => {
      const aHasBrazil = (a.locations || []).some(l => l.country === "Brazil")
      const bHasBrazil = (b.locations || []).some(l => l.country === "Brazil")
      if (aHasBrazil && !bHasBrazil) return -1
      if (!aHasBrazil && bHasBrazil) return 1
      return 0
    })
  }, [trials])

  // Count Brazil trials
  const brazilTrialsCount = useMemo(() => {
    return trials.filter(t => (t.locations || []).some(l => l.country === "Brazil")).length
  }, [trials])

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            {t("searchTitle")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-muted-foreground"
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("filters")}
            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Conditions */}
          <div>
            <Label htmlFor="conditions" className="text-muted-foreground">{t("conditions")}</Label>
            <Input
              id="conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder={t("conditionsPlaceholder")}
              className="bg-muted border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("conditionsHint")} •{" "}
              <span className="text-amber-600 dark:text-amber-400">{t("useEnglish")}</span>
              {" "}{t("conditionsExample")}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {t("searchDisclaimer")}
            </p>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
              {/* Status */}
              <div>
                <Label className="text-muted-foreground mb-2 block">{t("status")}</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleStatus(opt.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        status.includes(opt.value)
                          ? "bg-primary/10 border-primary/50 text-primary"
                          : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase */}
              <div>
                <Label className="text-muted-foreground mb-2 block">{t("phase")}</Label>
                <div className="flex flex-wrap gap-2">
                  {PHASE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => togglePhase(opt.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        phase.includes(opt.value)
                          ? "bg-purple-500/10 border-purple-500/50 text-purple-700 dark:text-purple-400"
                          : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-muted-foreground mb-2 block">{t("location")}</Label>
                <Select value={locationState || "__all__"} onValueChange={(v) => setLocationState(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder={t("locationAll")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t("locationAll")}</SelectItem>
                    {BRAZIL_STATES.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distance */}
              {locationState && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">
                    {t("distance", { distance })}
                  </Label>
                  <input
                    type="range"
                    min={50}
                    max={1000}
                    step={50}
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              )}
            </div>
          )}

          {/* Search Button + Brazil Filter */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleBrazilFilter}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filterBrazilOnly
                  ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400"
                  : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
              } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
            >
              <MapPin className="h-4 w-4 inline mr-2" />
              {t("brazilOnly")} {filterBrazilOnly ? `(${totalCount})` : brazilTrialsCount > 0 ? `(${brazilTrialsCount})` : ""}
            </button>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {t("search")}
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground">
          {filterBrazilOnly
            ? t("resultsCountBrazil", { count: totalCount })
            : t("resultsCount", { count: totalCount })
          }
        </p>
      </div>

      {displayTrials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-xl glass border border-border">
          {t("noResults")}
        </div>
      ) : (
        <div className="space-y-4">
          {displayTrials.map(trial => {
            const brazilLocs = getBrazilLocations(trial)
            const hasBrazilLocation = brazilLocs.length > 0

            return (
              <div
                key={trial.nct_id}
                className={`p-6 rounded-xl glass border transition-colors ${
                  hasBrazilLocation ? "border-green-500/30" : "border-border"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(trial.status)}`}>
                        {STATUS_OPTIONS.find(s => s.value === trial.status)?.label || trial.status}
                      </span>
                      {trial.phase && trial.phase.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          {trial.phase.join(", ")}
                        </span>
                      )}
                      {hasBrazilLocation && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30">
                          {t("brazil")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg leading-tight text-foreground">{trial.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{trial.nct_id}</p>
                  </div>
                </div>

                {/* Brief Summary */}
                {trial.brief_summary && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {trial.brief_summary}
                  </p>
                )}

                {/* Info Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                  {/* Locations */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">{t("locations")}</p>
                      <p className="text-foreground">
                        {hasBrazilLocation
                          ? brazilLocs.map(l => `${l.city}, ${l.country}`).join("; ")
                          : t("locationsCount", { count: (trial.locations || []).length })
                        }
                      </p>
                    </div>
                  </div>

                  {/* Eligibility */}
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">{t("eligibility")}</p>
                      <p className="text-foreground">
                        {trial.eligibility?.minimum_age || "—"} - {trial.eligibility?.maximum_age || "—"}
                        {trial.eligibility?.gender && trial.eligibility.gender !== "ALL" && `, ${trial.eligibility.gender}`}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">{t("period")}</p>
                      <p className="text-foreground">
                        {trial.start_date || "—"} {t("until")} {trial.completion_date || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTrial(trial)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("viewDetails")}
                  </Button>
                  <a
                    href={trial.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    ClinicalTrials.gov
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Trial Detail Dialog */}
      {selectedTrial && (
        <TrialDetailDialog
          trial={selectedTrial}
          open={!!selectedTrial}
          onOpenChange={(open) => !open && setSelectedTrial(null)}
        />
      )}
    </div>
  )
}
