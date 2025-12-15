"use client"

import { useState, useMemo } from "react"
import { Search, Loader2, MapPin, Calendar, Users, ExternalLink, Bell, ChevronDown, ChevronUp, Filter } from "lucide-react"
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
import { searchClinicalTrials, type Trial, type SearchFilters } from "./actions"
import { TrialDetailDialog } from "./trial-detail-dialog"
import { NotifyMembersDialog } from "./notify-members-dialog"

interface ClinicalTrialsClientProps {
  initialTrials: Trial[]
  initialTotalCount: number
  statesWithMembers: string[]
  recruitingCount: number
  brazilCount: number
}

const STATUS_OPTIONS = [
  { value: "RECRUITING", label: "Recrutando" },
  { value: "NOT_YET_RECRUITING", label: "Em breve" },
  { value: "ACTIVE_NOT_RECRUITING", label: "Ativo (não recrutando)" },
  { value: "COMPLETED", label: "Concluído" },
]

const PHASE_OPTIONS = [
  { value: "EARLY_PHASE1", label: "Fase 0" },
  { value: "PHASE1", label: "Fase 1" },
  { value: "PHASE2", label: "Fase 2" },
  { value: "PHASE3", label: "Fase 3" },
  { value: "PHASE4", label: "Fase 4" },
  { value: "NA", label: "N/A" },
]

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
  statesWithMembers,
  recruitingCount,
  brazilCount,
}: ClinicalTrialsClientProps) {
  const [trials, setTrials] = useState<Trial[]>(initialTrials)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters (English - ClinicalTrials.gov uses EN)
  const [conditions, setConditions] = useState("tetraplegia, quadriplegia, tetraparesis, quadriparesis, spinal cord injury")
  const [status, setStatus] = useState<string[]>(["RECRUITING"])
  const [phase, setPhase] = useState<string[]>([])
  const [locationState, setLocationState] = useState<string>("")
  const [distance, setDistance] = useState<number>(500)

  // Quick filters (badge clicks)
  const [filterBrazilOnly, setFilterBrazilOnly] = useState(false)
  const [filterStatesWithMembers, setFilterStatesWithMembers] = useState(false)

  // Dialogs
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null)
  const [notifyTrial, setNotifyTrial] = useState<Trial | null>(null)

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)

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
    } else {
      setError(result.error)
    }

    setIsLoading(false)
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
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "NOT_YET_RECRUITING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "ACTIVE_NOT_RECRUITING":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "COMPLETED":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getBrazilLocations = (trial: Trial) => {
    return (trial.locations || []).filter(loc => loc.country === "Brazil")
  }

  // Sort trials: Brazil first (no client-side filtering - API already filtered by coordinates)
  const displayTrials = useMemo(() => {
    let filtered = [...trials]

    // States with members filter: only show trials in states where we have members
    // This is client-side because API doesn't support state filtering
    if (filterStatesWithMembers) {
      filtered = filtered.filter(t => {
        const trialStates = (t.locations || [])
          .filter(l => l.country === "Brazil")
          .map(l => l.state)
          .filter(Boolean) as string[]
        return trialStates.some(s => statesWithMembers.includes(s))
      })
    }

    // Sort: Brazil locations first
    return filtered.sort((a, b) => {
      const aHasBrazil = (a.locations || []).some(l => l.country === "Brazil")
      const bHasBrazil = (b.locations || []).some(l => l.country === "Brazil")
      if (aHasBrazil && !bHasBrazil) return -1
      if (!aHasBrazil && bHasBrazil) return 1
      return 0
    })
  }, [trials, filterStatesWithMembers, statesWithMembers])

  // Count trials in states with members
  const currentStatesWithMembersCount = useMemo(() => {
    return trials.filter(t => {
      const trialStates = (t.locations || [])
        .filter(l => l.country === "Brazil")
        .map(l => l.state)
        .filter(Boolean) as string[]
      return trialStates.some(s => statesWithMembers.includes(s))
    }).length
  }, [trials, statesWithMembers])

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Clickable Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={async () => {
            if (filterBrazilOnly || filterStatesWithMembers) {
              // Reset to default recruiting search
              setIsLoading(true)
              setFilterBrazilOnly(false)
              setFilterStatesWithMembers(false)
              const result = await searchClinicalTrials({
                conditions: conditions.split(",").map(c => c.trim()).filter(Boolean),
                status: ["RECRUITING"],
                page_size: 50,
              })
              if (result.success) {
                setTrials(result.data.trials)
                setTotalCount(result.data.total_count)
              }
              setIsLoading(false)
            }
          }}
          disabled={isLoading}
          className={`p-4 rounded-xl border transition-all text-left ${
            !filterBrazilOnly && !filterStatesWithMembers
              ? "bg-primary/20 border-primary/50 ring-2 ring-primary/50"
              : "bg-primary/10 border-primary/30 hover:bg-primary/20"
          } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-primary" />
            <p className="text-sm text-primary/70">Recrutando</p>
          </div>
          <p className="text-2xl font-bold text-primary">{recruitingCount}</p>
        </button>

        <button
          onClick={async () => {
            if (!filterBrazilOnly) {
              // Fetch Brazil trials from API
              setIsLoading(true)
              setFilterStatesWithMembers(false)
              const result = await searchClinicalTrials({
                conditions: conditions.split(",").map(c => c.trim()).filter(Boolean),
                status: ["RECRUITING"],
                latitude: -23.5505,  // São Paulo
                longitude: -46.6333,
                distance: 3000,  // Cover all of Brazil
                page_size: 50,
              })
              if (result.success) {
                setTrials(result.data.trials)
                setTotalCount(result.data.total_count)
                setFilterBrazilOnly(true)
              }
              setIsLoading(false)
            } else {
              // Reset to default search
              setIsLoading(true)
              setFilterBrazilOnly(false)
              const result = await searchClinicalTrials({
                conditions: conditions.split(",").map(c => c.trim()).filter(Boolean),
                status: ["RECRUITING"],
                page_size: 50,
              })
              if (result.success) {
                setTrials(result.data.trials)
                setTotalCount(result.data.total_count)
              }
              setIsLoading(false)
            }
          }}
          disabled={isLoading}
          className={`p-4 rounded-xl border transition-all text-left ${
            filterBrazilOnly
              ? "bg-green-500/20 border-green-500/50 ring-2 ring-green-400/50"
              : "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
          } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-green-400" />
            <p className="text-sm text-green-400/70">No Brasil</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{brazilCount}</p>
        </button>

        <button
          onClick={async () => {
            if (!filterStatesWithMembers) {
              // Fetch Brazil trials first, then we'll filter by states client-side
              setIsLoading(true)
              setFilterBrazilOnly(false)
              const result = await searchClinicalTrials({
                conditions: conditions.split(",").map(c => c.trim()).filter(Boolean),
                status: ["RECRUITING"],
                latitude: -23.5505,  // São Paulo
                longitude: -46.6333,
                distance: 3000,  // Cover all of Brazil
                page_size: 50,
              })
              if (result.success) {
                setTrials(result.data.trials)
                setTotalCount(result.data.total_count)
                setFilterStatesWithMembers(true)
              }
              setIsLoading(false)
            } else {
              // Reset to default search
              setIsLoading(true)
              setFilterStatesWithMembers(false)
              const result = await searchClinicalTrials({
                conditions: conditions.split(",").map(c => c.trim()).filter(Boolean),
                status: ["RECRUITING"],
                page_size: 50,
              })
              if (result.success) {
                setTrials(result.data.trials)
                setTotalCount(result.data.total_count)
              }
              setIsLoading(false)
            }
          }}
          disabled={isLoading}
          className={`p-4 rounded-xl border transition-all text-left ${
            filterStatesWithMembers
              ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-400/50"
              : "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
          } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-blue-400/70">Estados c/ Membros</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{currentStatesWithMembersCount > 0 ? currentStatesWithMembersCount : "—"}</p>
        </button>
      </div>

      {/* Search Form */}
      <div className="mb-6 p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Estudos
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-white/60"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Conditions */}
          <div>
            <Label htmlFor="conditions" className="text-white/70">Condições médicas</Label>
            <Input
              id="conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="tetraplegia, quadriplegia, spinal cord injury"
              className="bg-white/5 border-white/10"
            />
            <p className="text-xs text-white/50 mt-1">Separadas por vírgula</p>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              {/* Status */}
              <div>
                <Label className="text-white/70 mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleStatus(opt.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        status.includes(opt.value)
                          ? "bg-primary/20 border-primary/50 text-primary"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase */}
              <div>
                <Label className="text-white/70 mb-2 block">Fase</Label>
                <div className="flex flex-wrap gap-2">
                  {PHASE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => togglePhase(opt.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        phase.includes(opt.value)
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-white/70 mb-2 block">Localização (Estado)</Label>
                <Select value={locationState || "__all__"} onValueChange={(v) => setLocationState(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Todos os locais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os locais</SelectItem>
                    {BRAZIL_STATES.map(state => (
                      <SelectItem key={state} value={state}>
                        {state} {statesWithMembers.includes(state) && "★"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/50 mt-1">★ = Estado com membros cadastrados</p>
              </div>

              {/* Distance */}
              {locationState && (
                <div>
                  <Label className="text-white/70 mb-2 block">
                    Distância: {distance} milhas
                  </Label>
                  <input
                    type="range"
                    min={50}
                    max={1000}
                    step={50}
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Search Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-white/60">
          {filterStatesWithMembers
            ? `${displayTrials.length} de ${totalCount} estudos (filtro: Estados com membros)`
            : filterBrazilOnly
              ? `${totalCount} estudos no Brasil`
              : `${totalCount} estudos encontrados`
          }
        </p>
      </div>

      {displayTrials.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          Nenhum estudo encontrado. Tente ajustar os filtros.
        </div>
      ) : (
        <div className="space-y-4">
          {displayTrials.map(trial => {
            const brazilLocs = getBrazilLocations(trial)
            const hasBrazilLocation = brazilLocs.length > 0

            return (
              <div
                key={trial.nct_id}
                className={`p-6 rounded-xl bg-white/5 border transition-colors ${
                  hasBrazilLocation ? "border-green-500/30" : "border-white/10"
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
                        <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70">
                          {trial.phase.join(", ")}
                        </span>
                      )}
                      {hasBrazilLocation && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          Brasil
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg leading-tight">{trial.title}</h3>
                    <p className="text-sm text-white/50 mt-1">{trial.nct_id}</p>
                  </div>
                </div>

                {/* Brief Summary */}
                {trial.brief_summary && (
                  <p className="text-sm text-white/70 mb-4 line-clamp-2">
                    {trial.brief_summary}
                  </p>
                )}

                {/* Info Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                  {/* Locations */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/50">Locais</p>
                      <p className="text-white/80">
                        {hasBrazilLocation
                          ? brazilLocs.map(l => `${l.city}, ${l.country}`).join("; ")
                          : `${(trial.locations || []).length} localização(ões)`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Eligibility */}
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/50">Elegibilidade</p>
                      <p className="text-white/80">
                        {trial.eligibility?.minimum_age || "—"} - {trial.eligibility?.maximum_age || "—"}
                        {trial.eligibility?.gender && trial.eligibility.gender !== "ALL" && `, ${trial.eligibility.gender}`}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/50">Período</p>
                      <p className="text-white/80">
                        {trial.start_date || "—"} até {trial.completion_date || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTrial(trial)}
                    className="text-white/70 hover:text-white"
                  >
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotifyTrial(trial)}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notificar Membros
                  </Button>
                  <a
                    href={trial.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-sm text-white/50 hover:text-white"
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

      {/* Dialogs */}
      {selectedTrial && (
        <TrialDetailDialog
          trial={selectedTrial}
          open={!!selectedTrial}
          onOpenChange={(open) => !open && setSelectedTrial(null)}
        />
      )}

      {notifyTrial && (
        <NotifyMembersDialog
          trial={notifyTrial}
          open={!!notifyTrial}
          onOpenChange={(open) => !open && setNotifyTrial(null)}
          statesWithMembers={statesWithMembers}
        />
      )}
    </div>
  )
}
