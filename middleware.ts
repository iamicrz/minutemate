import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

type CustomPublicMetadata = {
  role?: "seeker" | "provider" | "admin"
}

declare module "@clerk/nextjs/server" {
  interface PublicMetadata extends CustomPublicMetadata {}
}

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/auth/signup",
  "/auth/login",
  "/api/webhooks(.*)",
  "/professionals",
  "/_next(.*)",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
  "/onboarding",
]);

// Define seeker routes
const isSeekerRoute = createRouteMatcher([
  "/seeker/(.*)",
]);

// Define provider routes
const isProviderRoute = createRouteMatcher([
  "/provider/(.*)",
]);

// Define admin routes
const isAdminRoute = createRouteMatcher([
  "/admin/(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }

  // Get authentication state
  const { userId, sessionClaims } = await auth();
  
  // If not authenticated, return 401
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user role from public metadata in session claims
  const publicMetadata = sessionClaims?.publicMetadata as CustomPublicMetadata || {};
  const userRole = publicMetadata.role;

  // Special case for auth redirect - always allow
  if (req.nextUrl.pathname.startsWith('/auth/redirect')) {
    return;
  }

  // Role-based access control
  if (isSeekerRoute(req) && userRole !== 'seeker') {
    // If trying to access seeker routes but not a seeker, redirect to auth redirect
    return Response.redirect(new URL('/auth/redirect', req.url));
  }

  if (isProviderRoute(req) && userRole !== 'provider') {
    // If trying to access provider routes but not a provider, redirect to auth redirect
    return Response.redirect(new URL('/auth/redirect', req.url));
  }

  if (isAdminRoute(req) && userRole !== 'admin') {
    // If trying to access admin routes but not an admin, redirect to auth redirect
    return Response.redirect(new URL('/auth/redirect', req.url));
  }
});

export const config = {
  matcher: [
    "/((?!.*\\.[\\w]+$|_next).*)", // Match all paths except static files
    "/",
    "/(api|trpc)(.*)", // Match API and tRPC routes
  ],
};
