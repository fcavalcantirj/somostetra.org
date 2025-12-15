import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest, response?: NextResponse) {
  let supabaseResponse = response || NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = response || NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Extract path without locale prefix for checking routes
    const pathname = request.nextUrl.pathname
    // Check if path starts with locale (e.g., /en/, /es/, /pt/)
    const localePattern = /^\/(en|es|pt)(\/|$)/
    const pathWithoutLocale = pathname.replace(localePattern, '/')

    const isAuthPage = pathWithoutLocale.startsWith("/auth")
    const isLandingPage = pathWithoutLocale === "/" || pathname === "/"

    const protectedRoutes = ["/dashboard", "/votes", "/referrals", "/badges", "/admin"]
    const isProtectedRoute = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route))

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone()
      // Get the locale from the pathname if present
      const localeMatch = pathname.match(localePattern)
      const locale = localeMatch ? localeMatch[1] : ''
      url.pathname = locale ? `/${locale}/auth/login` : "/auth/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      const redirectTo = request.nextUrl.searchParams.get("redirect")
      // Get the locale from the pathname if present
      const localeMatch = pathname.match(localePattern)
      const locale = localeMatch ? localeMatch[1] : ''
      url.pathname = redirectTo || (locale ? `/${locale}/dashboard` : "/dashboard")
      url.search = "" // Clear query params
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    return supabaseResponse
  }
}
