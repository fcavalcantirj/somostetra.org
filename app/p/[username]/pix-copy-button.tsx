"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function PixCopyButton({ pixKey }: { pixKey: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors font-semibold"
    >
      {copied ? (
        <>
          <Check className="h-5 w-5" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="h-5 w-5" />
          Copiar PIX
        </>
      )}
    </button>
  )
}
