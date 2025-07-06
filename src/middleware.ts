import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const pathname = req.nextUrl.pathname
  const isAuth = !!req.auth

  // Allow access to auth pages when not logged in
  if (pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!isAuth && !pathname.startsWith("/api/auth")) {
    const newUrl = new URL("/auth/login", req.url)
    return NextResponse.redirect(newUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}