import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo/schema"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "SomosTetra - Comunidade Brasileira de Tetraplégicos",
    template: "%s | SomosTetra",
  },
  description: "Plataforma comunitária para unir, fortalecer e dar voz à comunidade tetraplégica do Brasil. Conectamos tetraplégicos a ensaios clínicos, realizamos desejos e construímos uma comunidade forte.",
  metadataBase: new URL("https://somostetra.org"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://somostetra.org",
    siteName: "SomosTetra",
    title: "SomosTetra - Comunidade Brasileira de Tetraplégicos",
    description: "Plataforma comunitária para unir, fortalecer e dar voz à comunidade tetraplégica do Brasil",
    images: [
      {
        url: "/logo_somos_tetra.jpeg",
        width: 800,
        height: 800,
        alt: "SomosTetra Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SomosTetra - Comunidade Brasileira de Tetraplégicos",
    description: "Plataforma comunitária para unir, fortalecer e dar voz à comunidade tetraplégica do Brasil",
    images: ["/logo_somos_tetra.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification here when available
    // google: "your-google-verification-code",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebsiteSchema()

  return (
    <html lang="pt-BR">
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-7ZTKBPSL4B" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7ZTKBPSL4B');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`font-sans ${spaceGrotesk.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <Analytics />
        </Suspense>
        <Toaster />
      </body>
    </html>
  )
}
