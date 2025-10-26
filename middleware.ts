import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes completely
  const publicPaths = [
    "/sign-in",
    "/sign-up",
    "/api",
    "/_next",
    "/assets",
    "/favicon.ico",
  ];

  // Check if pathname starts with any public path
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Check for session cookie
    const sessionToken = request.cookies.get("better-auth.session_token");

    if (!sessionToken) {
      // Only redirect if we're not already on a public page
      if (!pathname.startsWith("/sign-in") && !pathname.startsWith("/sign-up")) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }

    // Allow access if session cookie exists
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, allow the request to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
