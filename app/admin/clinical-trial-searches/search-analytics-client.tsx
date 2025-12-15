"use client"

import { useState } from "react"
import { MapPin, Filter, Calendar } from "lucide-react"

interface SearchRecord {
  id: string
  user_id: string
  query_conditions: string[]
  query_status: string[] | null
  query_phase: string[] | null
  query_location_state: string | null
  query_distance: number | null
  brazil_only: boolean
  results_count: number
  created_at: string
  profiles: {
    display_name: string | null
    email: string | null
  } | null
}

interface SearchAnalyticsClientProps {
  searches: SearchRecord[]
}

export function SearchAnalyticsClient({ searches }: SearchAnalyticsClientProps) {
  const [filterBrazil, setFilterBrazil] = useState<boolean | null>(null)

  const filteredSearches = searches.filter((search) => {
    if (filterBrazil !== null && search.brazil_only !== filterBrazil) {
      return false
    }
    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Filters */}
      <div className="border-b border-white/10 p-4 flex items-center gap-4">
        <span className="text-sm text-white/60">Filtros:</span>
        <button
          onClick={() => setFilterBrazil(filterBrazil === true ? null : true)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filterBrazil === true
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Apenas Brasil
        </button>
        <button
          onClick={() => setFilterBrazil(filterBrazil === false ? null : false)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filterBrazil === false
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          }`}
        >
          <Filter className="h-4 w-4" />
          Global
        </button>
        <span className="ml-auto text-sm text-white/40">
          {filteredSearches.length} buscas
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-sm text-white/60">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Condições</th>
              <th className="px-4 py-3 font-medium">Filtros</th>
              <th className="px-4 py-3 font-medium text-center">Resultados</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSearches.map((search) => (
              <tr key={search.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">
                      {search.profiles?.display_name || "Usuário"}
                    </p>
                    <p className="text-sm text-white/40">
                      {search.profiles?.email || search.user_id.slice(0, 8)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {search.query_conditions?.slice(0, 3).map((cond, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {cond}
                      </span>
                    ))}
                    {search.query_conditions?.length > 3 && (
                      <span className="text-xs text-white/40">
                        +{search.query_conditions.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {search.brazil_only && (
                      <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                        <MapPin className="h-3 w-3" />
                        Brasil
                      </span>
                    )}
                    {search.query_status?.map((status, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400"
                      >
                        {status}
                      </span>
                    ))}
                    {search.query_phase?.map((phase, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400"
                      >
                        {phase}
                      </span>
                    ))}
                    {search.query_location_state && (
                      <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                        {search.query_location_state}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-sm font-medium ${
                      search.results_count > 0
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {search.results_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Calendar className="h-4 w-4" />
                    {formatDate(search.created_at)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSearches.length === 0 && (
          <div className="py-12 text-center text-white/40">
            Nenhuma busca encontrada
          </div>
        )}
      </div>
    </div>
  )
}
