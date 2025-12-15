import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { locales, defaultLocale } from '@/lib/i18n/config'

const BASE_URL = 'https://somostetra.org'

// Static routes that should be indexed
const staticRoutes = [
  '',
  '/leaderboard',
  '/badges',
  '/votes',
  '/referrals',
  '/privacidade',
]

// Helper to generate URL with locale prefix
function getLocalizedUrl(path: string, locale: string): string {
  if (locale === defaultLocale) {
    return `${BASE_URL}${path}`
  }
  return `${BASE_URL}/${locale}${path}`
}

// Helper to generate alternates for all locales
function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {}

  for (const locale of locales) {
    alternates[locale] = getLocalizedUrl(path, locale)
  }

  // x-default points to the default locale (Portuguese)
  alternates['x-default'] = getLocalizedUrl(path, defaultLocale)

  return alternates
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Generate entries for static routes (all locales)
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap(route =>
    locales.map(locale => ({
      url: getLocalizedUrl(route, locale),
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly' as const,
      priority: route === '' ? 1.0 : 0.8,
      alternates: {
        languages: generateAlternates(route),
      },
    }))
  )

  // Fetch public profiles for dynamic routes
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .eq('profile_public', true)
    .not('username', 'is', null)

  const profileEntries: MetadataRoute.Sitemap = (profiles || []).flatMap(profile =>
    locales.map(locale => ({
      url: getLocalizedUrl(`/p/${profile.username}`, locale),
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: {
        languages: generateAlternates(`/p/${profile.username}`),
      },
    }))
  )

  // Fetch active votes for dynamic routes
  const { data: votes } = await supabase
    .from('votes')
    .select('id, updated_at')
    .eq('active', true)

  const voteEntries: MetadataRoute.Sitemap = (votes || []).flatMap(vote =>
    locales.map(locale => ({
      url: getLocalizedUrl(`/votes/${vote.id}`, locale),
      lastModified: vote.updated_at ? new Date(vote.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
      alternates: {
        languages: generateAlternates(`/votes/${vote.id}`),
      },
    }))
  )

  return [
    ...staticEntries,
    ...profileEntries,
    ...voteEntries,
  ]
}
