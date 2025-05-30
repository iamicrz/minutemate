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
  // Allow public routes and auth redirect without authentication
  if (isPublicRoute(req) || req.nextUrl.pathname.startsWith('/auth/redirect')) {
    return;
  }

  // Get authentication state
  const { userId, sessionClaims } = await auth();
  
  // If not authenticated, redirect to login
  if (!userId) {
    return Response.redirect(new URL('/auth/login', req.url));
  }

  // Get user role from public metadata in session claims
  const publicMetadata = sessionClaims?.publicMetadata as CustomPublicMetadata || {};
  const userRole = publicMetadata.role;
  
  // If no role is set yet, allow access to onboarding
  if (!userRole && req.nextUrl.pathname === '/onboarding') {
    return;
  }
  
  // Simple role-based access control
  const isAccessAllowed = 
    (isSeekerRoute(req) && userRole === 'seeker') ||
    (isProviderRoute(req) && userRole === 'provider') ||
    (isAdminRoute(req) && userRole === 'admin');
  
  // If access is not allowed, redirect to auth redirect
  if (!isAccessAllowed) {
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
