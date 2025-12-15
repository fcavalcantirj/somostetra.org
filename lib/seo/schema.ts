import { BASE_URL, SITE_NAME } from './metadata'

/**
 * Organization Schema for SomosTetra
 * Use in root layout for site-wide brand recognition
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'SomosTetra - Comunidade Brasileira de Tetraplégicos',
    url: BASE_URL,
    logo: `${BASE_URL}/logo_somos_tetra.jpeg`,
    description: 'Plataforma comunitária para unir, fortalecer e dar voz à comunidade tetraplégica do Brasil',
    foundingDate: '2024',
    areaServed: {
      '@type': 'Country',
      name: 'Brazil',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'privacidade@somostetra.org',
      contactType: 'customer service',
      availableLanguage: ['Portuguese', 'English', 'Spanish'],
    },
    sameAs: [
      // Add social media profiles here when available
    ],
  }
}

/**
 * WebSite Schema with search action
 * Use in root layout
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: 'Plataforma comunitária para unir, fortalecer e dar voz à comunidade tetraplégica do Brasil',
    inLanguage: ['pt-BR', 'en-US', 'es-ES'],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
  }
}

/**
 * Person Schema for public profile pages
 */
export function generatePersonSchema({
  name,
  username,
  bio,
  city,
  state,
  profileImage,
  badges,
}: {
  name: string
  username: string
  bio?: string
  city?: string
  state?: string
  profileImage?: string
  badges?: string[]
}) {
  const location = [city, state].filter(Boolean).join(', ')

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${BASE_URL}/p/${username}`,
    ...(bio && { description: bio }),
    ...(profileImage && { image: profileImage }),
    ...(location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: state,
        addressCountry: 'BR',
      },
    }),
    ...(badges && badges.length > 0 && {
      award: badges,
    }),
    memberOf: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
  }
}

/**
 * BreadcrumbList Schema for navigation
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Community/ItemList Schema for leaderboard
 */
export function generateLeaderboardSchema({
  title,
  description,
  members,
}: {
  title: string
  description: string
  members: { name: string; points: number; position: number }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    numberOfItems: members.length,
    itemListElement: members.slice(0, 10).map((member) => ({
      '@type': 'ListItem',
      position: member.position,
      name: member.name,
      description: `${member.points} pontos`,
    })),
  }
}

/**
 * Event Schema for community votes
 */
export function generateVoteSchema({
  id,
  title,
  description,
  startDate,
  endDate,
  locale,
}: {
  id: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  locale: string
}) {
  const path = locale === 'pt' ? `/votes/${id}` : `/${locale}/votes/${id}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    ...(description && { description }),
    url: `${BASE_URL}${path}`,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
    location: {
      '@type': 'VirtualLocation',
      url: `${BASE_URL}${path}`,
    },
  }
}

/**
 * Helper to render schema as script tag
 */
export function renderSchemaScript(schema: object): string {
  return JSON.stringify(schema)
}
