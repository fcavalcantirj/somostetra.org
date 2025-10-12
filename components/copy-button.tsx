"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      onClick={handleCopy}
      size="lg"
      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-bold h-14 px-8"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 mr-2" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="w-5 h-5 mr-2" />
          Copiar
        </>
      )}
    </Button>
  )
}
