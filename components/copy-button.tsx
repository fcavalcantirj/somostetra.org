"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { trackReferralLinkCopied } from "@/lib/analytics"
import { useTranslations } from "next-intl"

export function CopyButton({ text, linkType }: { text: string; linkType?: "member" | "supporter" }) {
  const t = useTranslations("common")
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    if (linkType) {
      trackReferralLinkCopied(linkType)
    }
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
          {t("copied")}
        </>
      ) : (
        <>
          <Copy className="w-5 h-5 mr-2" />
          {t("copy")}
        </>
      )}
    </Button>
  )
}
