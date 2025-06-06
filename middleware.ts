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
  if (isPublicRoute(req)) {
    return;
  }

  // Await auth() to get user/session info (returns a Promise)
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Clerk role from publicMetadata (handle empty sessionClaims case)
  const role = (sessionClaims && typeof sessionClaims === 'object' && 'publicMetadata' in sessionClaims)
    ? (sessionClaims.publicMetadata as any)?.role
    : undefined;

  // If no role, force onboarding
  if (!role) {
    if (req.nextUrl.pathname !== "/onboarding") {
      const onboardingUrl = req.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      return Response.redirect(onboardingUrl);
    }
    return;
  }

  // Role-based dashboard redirect after auth
  if (req.nextUrl.pathname === "/auth/redirect") {
    const url = req.nextUrl.clone();
    if (role === "admin") url.pathname = "/admin/dashboard";
    else if (role === "provider") url.pathname = "/provider/dashboard";
    else url.pathname = "/seeker/dashboard";
    return Response.redirect(url);
  }

  // Role-based route protection
  if (isSeekerRoute(req) && role !== "seeker") {
    const url = req.nextUrl.clone();
    if (role === "admin") url.pathname = "/admin/dashboard";
    else if (role === "provider") url.pathname = "/provider/dashboard";
    else url.pathname = "/onboarding";
    return Response.redirect(url);
  }
  if (isProviderRoute(req) && role !== "provider") {
    const url = req.nextUrl.clone();
    if (role === "admin") url.pathname = "/admin/dashboard";
    else if (role === "seeker") url.pathname = "/seeker/dashboard";
    else url.pathname = "/onboarding";
    return Response.redirect(url);
  }
  if (isAdminRoute(req) && role !== "admin") {
    const url = req.nextUrl.clone();
    if (role === "provider") url.pathname = "/provider/dashboard";
    else if (role === "seeker") url.pathname = "/seeker/dashboard";
    else url.pathname = "/onboarding";
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!.*\\.[\\w]+$|_next).*)", // Match all paths except static files
    "/",
    "/(api|trpc)(.*)", // Match API and tRPC routes
  ],
};
