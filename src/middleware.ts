import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
    
    // Check if user is trying to access admin routes
    if (isAdminRoute && token?.role !== "ADMIN" && token?.role !== "ORGANIZER") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/game/:path*",
  ]
} 