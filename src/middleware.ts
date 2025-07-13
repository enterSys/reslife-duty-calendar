import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Add Node.js types for middleware
declare global {
  var process: {
    env: {
      NODE_ENV?: string
      DATABASE_URL?: string
      POSTGRES_URL_NON_POOLING?: string
      NEXTAUTH_SECRET?: string
      AUTH_SECRET?: string
    }
  }
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname
  
  // Check if we're in a production environment and have required env vars
  const isProduction = process.env.NODE_ENV === "production"
  const hasDatabaseUrl = !!process.env.DATABASE_URL
  const hasAuthSecret = !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET
  
  // If we're in production and missing critical environment variables,
  // allow access to prevent middleware failures
  if (isProduction && (!hasDatabaseUrl || !hasAuthSecret)) {
    console.warn("Missing critical environment variables in production")
    return NextResponse.next()
  }

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