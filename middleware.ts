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

  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
});

export const config = {
  matcher: [
    "/((?!.*\\.[\\w]+$|_next).*)", // Match all paths except static files
    "/",
    "/(api|trpc)(.*)", // Match API and tRPC routes
  ],
};
