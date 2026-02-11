import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/landing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/render/:path*", // Video export render pages (accessed by Puppeteer)
  "/api/inngest(.*)", // Inngest webhooks
  "/api/test-public", // Test endpoint
  "/api/books/:path*", // Book APIs - handler checks ownership where needed
  "/api/proxy-image(.*)", // Image proxy is public
  "/manifest.json", // PWA manifest
  "/sw.js", // Service worker
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

// API routes that require authentication
const isApiRoute = createRouteMatcher([
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;

  // Detect Clerk handshake redirect loop: if the URL has __clerk_hs_reason,
  // it means we bounced back from a failed Clerk handshake. Clear stale cookies
  // and redirect cleanly to break the loop.
  const hsReason = url.searchParams.get("__clerk_hs_reason");
  if (hsReason) {
    // Strip Clerk query params and redirect cleanly
    const cleanUrl = new URL(url.pathname, url.origin);
    url.searchParams.forEach((value, key) => {
      if (!key.startsWith("__clerk")) {
        cleanUrl.searchParams.set(key, value);
      }
    });

    const response = NextResponse.redirect(cleanUrl);
    // Clear all Clerk-related cookies to break the loop
    const cookieNames = [
      "__client_uat",
      "__session",
      "__clerk_db_jwt",
      "__client_uat_suffixed",
      "__session_suffixed",
      "__clerk_db_jwt_suffixed",
    ];
    for (const name of cookieNames) {
      response.cookies.delete(name);
    }
    return response;
  }

  // Skip auth enforcement for public routes (Clerk still resolves auth state)
  if (isPublicRoute(request)) {
    return;
  }

  // For API routes, return JSON 401 instead of redirecting
  if (isApiRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    return;
  }

  // For page routes, protect normally (will redirect to sign-in)
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
