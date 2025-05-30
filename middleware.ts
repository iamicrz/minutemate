import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

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

export default clerkMiddleware(async (auth, req) => {
  // Always allow access to static files and public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Special case for auth redirect page to prevent loops
  if (req.nextUrl.pathname === '/auth/redirect') {
    return NextResponse.next();
  }
  
  // Get the authentication state
  const { userId } = await auth();
  const sessionClaims = await auth().then(auth => auth.sessionClaims);
  
  // If not authenticated, redirect to login
  if (!userId) {
    const loginUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Get user role from public metadata
  const publicMetadata = sessionClaims?.publicMetadata as CustomPublicMetadata || {};
  const userRole = publicMetadata.role;
  
  // If no role is set yet, allow access to onboarding
  if (!userRole && req.nextUrl.pathname === '/onboarding') {
    return NextResponse.next();
  }
  
  // Check if the user is accessing a route appropriate for their role
  if (userRole === 'seeker' && isSeekerRoute(req)) {
    return NextResponse.next();
  }
  
  if (userRole === 'provider' && isProviderRoute(req)) {
    return NextResponse.next();
  }
  
  if (userRole === 'admin' && isAdminRoute(req)) {
    return NextResponse.next();
  }
  
  // If the user is trying to access a route not appropriate for their role,
  // redirect them to their dashboard
  if (userRole) {
    const dashboardUrl = new URL(`/${userRole}/dashboard`, req.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // If we don't know the user's role yet, send them to onboarding
  const onboardingUrl = new URL('/onboarding', req.url);
  return NextResponse.redirect(onboardingUrl);
});

export const config = {
  matcher: [
    "/((?!.*\.[\w]+$|_next).*)", // Match all paths except static files
    "/",
    "/(api|trpc)(.*)", // Match API and tRPC routes
  ],
};
