import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://somostetra.org'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/api/',
          '/api',
          '/auth/',
          '/dashboard/',
          '/supporter-dashboard/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
