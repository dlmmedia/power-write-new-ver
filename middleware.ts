import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/landing(.*)",
  "/render/(.*)", // Video export render pages (accessed by Puppeteer)
  "/api/inngest(.*)", // Inngest webhooks
  "/api/books/search(.*)", // Book search is public
  "/api/books/(\\d+)", // Book details for render page (numeric IDs only)
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
  // Skip public routes
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
