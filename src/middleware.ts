import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const pathname = req.nextUrl.pathname

  try {
    const isAuth = !!req.auth

    // Allow access to auth pages when not logged in
    if (pathname.startsWith("/auth")) {
      return NextResponse.next()
    }

    // Allow access to API health checks and database checks
    if (pathname.startsWith("/api/health") || pathname.startsWith("/api/db-check")) {
      return NextResponse.next()
    }

    // Redirect to login if not authenticated
    if (!isAuth && !pathname.startsWith("/api/auth")) {
      const newUrl = new URL("/auth/login", req.url)
      return NextResponse.redirect(newUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    
    // In case of any error, allow the request to proceed
    // This prevents the middleware from causing 500 errors
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - api/health (health check endpoint)
     * - api/db-check (database check endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|api/health|api/db-check|_next/static|_next/image|favicon.ico|public).*)",
  ],
}