import createMiddleware from 'next-intl/middleware';
import { updateSession } from "@/lib/supabase/middleware"
import { NextRequest, NextResponse } from "next/server"
import { locales, defaultLocale } from '@/lib/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // No prefix for default locale (Portuguese)
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip admin routes - no i18n (Portuguese only)
  if (pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

  // Skip API routes
  if (pathname.startsWith('/api')) {
    return await updateSession(request);
  }

  // Handle i18n routing first
  const intlResponse = intlMiddleware(request);

  // Then handle Supabase auth on the i18n response
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
