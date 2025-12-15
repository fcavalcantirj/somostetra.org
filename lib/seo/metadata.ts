import { Metadata } from 'next'
import { locales, defaultLocale, Locale } from '@/lib/i18n/config'

export const BASE_URL = 'https://somostetra.org'
export const SITE_NAME = 'SomosTetra'

// Default OG image (you can replace with actual image path)
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`

interface GenerateMetadataOptions {
  title: string
  description: string
  path: string
  locale: Locale
  image?: string
  noIndex?: boolean
  type?: 'website' | 'article' | 'profile'
}

/**
 * Get canonical URL for a given path and locale
 */
export function getCanonicalUrl(path: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return `${BASE_URL}${path}`
  }
  return `${BASE_URL}/${locale}${path}`
}

/**
 * Generate alternate language URLs for hreflang
 */
export function generateLanguageAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {}

  for (const locale of locales) {
    alternates[locale] = getCanonicalUrl(path, locale)
  }

  return alternates
}

/**
 * Generate full metadata for a page
 */
export function generatePageMetadata({
  title,
  description,
  path,
  locale,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  type = 'website',
}: GenerateMetadataOptions): Metadata {
  const canonicalUrl = getCanonicalUrl(path, locale)
  const fullTitle = `${title} | ${SITE_NAME}`

  // Map locale to OpenGraph locale format
  const ogLocaleMap: Record<Locale, string> = {
    pt: 'pt_BR',
    en: 'en_US',
    es: 'es_ES',
  }

  const metadata: Metadata = {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateLanguageAlternates(path),
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: ogLocaleMap[locale],
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  }

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    }
  }

  return metadata
}

/**
 * Generate metadata for dynamic pages (profiles, votes, etc.)
 */
export function generateDynamicMetadata({
  title,
  description,
  path,
  locale,
  image,
  type = 'article',
}: GenerateMetadataOptions): Metadata {
  return generatePageMetadata({
    title,
    description,
    path,
    locale,
    image,
    type,
  })
}

/**
 * Translations for common SEO metadata (fallback when translations not available)
 */
export const seoTranslations = {
  pt: {
    siteName: 'SomosTetra - Comunidade Brasileira de Tetraplégicos',
    defaultDescription: 'Plataforma comunitária para unir, fortalecer e dar voz à comunidade tetraplégica do Brasil',
    landing: {
      title: 'Comunidade Brasileira de Tetraplégicos',
      description: 'Plataforma comunitária para unir, fortalecer e dar voz à comunidade tetraplégica do Brasil. Conectamos tetraplégicos a ensaios clínicos, realizamos desejos e construímos uma comunidade forte.',
    },
    leaderboard: {
      title: 'Ranking da Comunidade',
      description: 'Veja os membros mais engajados da comunidade SomosTetra. Participe, ganhe pontos e conquiste badges.',
    },
    badges: {
      title: 'Conquistas e Badges',
      description: 'Descubra todas as conquistas disponíveis na comunidade SomosTetra. Participe e ganhe badges exclusivos.',
    },
    votes: {
      title: 'Votações da Comunidade',
      description: 'Participe das votações e ajude a decidir as próximas ações da comunidade SomosTetra.',
    },
    referrals: {
      title: 'Programa de Indicação',
      description: 'Convide amigos para a comunidade SomosTetra e ganhe pontos. Ajude a expandir nossa rede de apoio.',
    },
    privacy: {
      title: 'Política de Privacidade',
      description: 'Conheça nossa política de privacidade e como protegemos seus dados na plataforma SomosTetra.',
    },
  },
  en: {
    siteName: 'SomosTetra - Brazilian Tetraplegic Community',
    defaultDescription: 'Community platform to unite, strengthen and give voice to the tetraplegic community in Brazil',
    landing: {
      title: 'Brazilian Tetraplegic Community',
      description: 'Community platform to unite, strengthen and give voice to the tetraplegic community in Brazil. We connect tetraplegics to clinical trials, fulfill wishes and build a strong community.',
    },
    leaderboard: {
      title: 'Community Leaderboard',
      description: 'See the most engaged members of the SomosTetra community. Participate, earn points and achieve badges.',
    },
    badges: {
      title: 'Achievements and Badges',
      description: 'Discover all achievements available in the SomosTetra community. Participate and earn exclusive badges.',
    },
    votes: {
      title: 'Community Votes',
      description: 'Participate in votes and help decide the next actions of the SomosTetra community.',
    },
    referrals: {
      title: 'Referral Program',
      description: 'Invite friends to the SomosTetra community and earn points. Help expand our support network.',
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'Learn about our privacy policy and how we protect your data on the SomosTetra platform.',
    },
  },
  es: {
    siteName: 'SomosTetra - Comunidad Brasileña de Tetrapléjicos',
    defaultDescription: 'Plataforma comunitaria para unir, fortalecer y dar voz a la comunidad tetrapléjica de Brasil',
    landing: {
      title: 'Comunidad Brasileña de Tetrapléjicos',
      description: 'Plataforma comunitaria para unir, fortalecer y dar voz a la comunidad tetrapléjica de Brasil. Conectamos tetrapléjicos a ensayos clínicos, cumplimos deseos y construimos una comunidad fuerte.',
    },
    leaderboard: {
      title: 'Ranking de la Comunidad',
      description: 'Vea los miembros más comprometidos de la comunidad SomosTetra. Participe, gane puntos y obtenga insignias.',
    },
    badges: {
      title: 'Logros e Insignias',
      description: 'Descubra todos los logros disponibles en la comunidad SomosTetra. Participe y gane insignias exclusivas.',
    },
    votes: {
      title: 'Votaciones de la Comunidad',
      description: 'Participe en las votaciones y ayude a decidir las próximas acciones de la comunidad SomosTetra.',
    },
    referrals: {
      title: 'Programa de Referidos',
      description: 'Invita amigos a la comunidad SomosTetra y gana puntos. Ayuda a expandir nuestra red de apoyo.',
    },
    privacy: {
      title: 'Política de Privacidad',
      description: 'Conozca nuestra política de privacidad y cómo protegemos sus datos en la plataforma SomosTetra.',
    },
  },
}
