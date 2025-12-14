"use client"

import { useEffect, useState } from "react"

export function ActiveWishBanner() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Check if a wish was just created in this session
    const justCreated = sessionStorage.getItem("wishJustCreated")

    if (justCreated) {
      // Clear the flag so it shows on next visit
      sessionStorage.removeItem("wishJustCreated")
      // Don't show the banner this time
      setShouldShow(false)
    } else {
      // Show the banner (normal case - visiting /wishes after previous session)
      setShouldShow(true)
    }
  }, [])

  if (!shouldShow) return null

  return (
    <div className="p-6 rounded-2xl bg-amber-600 shadow-lg">
      <p className="text-sm text-white font-semibold">
        ⚠️ Você já possui um desejo ativo. Aguarde ele ser realizado ou rejeitado para criar outro.
      </p>
    </div>
  )
}
