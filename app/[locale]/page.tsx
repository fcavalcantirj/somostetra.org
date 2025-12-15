import { Metadata } from "next"
import { LandingPageContent } from "@/components/landing-page"
import { generatePageMetadata, seoTranslations } from "@/lib/seo"
import { Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const validLocale = (locale as Locale) || 'pt'
  const translations = seoTranslations[validLocale]

  return generatePageMetadata({
    title: translations.landing.title,
    description: translations.landing.description,
    path: '',
    locale: validLocale,
    type: 'website',
  })
}

export default function LandingPage() {
  return <LandingPageContent />
}
