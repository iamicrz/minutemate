import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/signup",
  "/auth/login",
  "/api/webhooks(.*)",
  "/professionals",
  "/onboarding",
  // Static assets
  "/_next(.*)",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
  "/images/(.*)",
  "/fonts/(.*)",
  "/assets/(.*)",
];

// Define routes that require specific roles
const seekerRoutes = /^\/seeker(\/.*)?$/;
const providerRoutes = /^\/provider(\/.*)?$/;
const adminRoutes = /^\/admin(\/.*)?$/;

export default authMiddleware({
  publicRoutes,
  afterAuth(auth, req) {
    // If the user is not authenticated and trying to access a private route
    if (!auth.userId && !isPublicRoute(req.nextUrl.pathname)) {
      const loginUrl = new URL("/auth/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // If the user is authenticated but has no role yet
    if (auth.userId && !auth.sessionClaims?.publicMetadata?.role) {
      // Allow access to onboarding
      if (req.nextUrl.pathname === "/onboarding") {
        return NextResponse.next();
      }
      
      // Redirect to onboarding for role selection
      const onboardingUrl = new URL("/onboarding", req.url);
      return NextResponse.redirect(onboardingUrl);
    }

    // If the user is authenticated and has a role
    if (auth.userId && auth.sessionClaims?.publicMetadata?.role) {
      const userRole = auth.sessionClaims.publicMetadata.role as string;
      
      // Check if the user is trying to access a route for their role
      const isAccessingSeeker = seekerRoutes.test(req.nextUrl.pathname);
      const isAccessingProvider = providerRoutes.test(req.nextUrl.pathname);
      const isAccessingAdmin = adminRoutes.test(req.nextUrl.pathname);
      
      // Allow access if the route matches the user's role
      if (
        (userRole === "seeker" && isAccessingSeeker) ||
        (userRole === "provider" && isAccessingProvider) ||
        (userRole === "admin" && isAccessingAdmin)
      ) {
        return NextResponse.next();
      }
      
      // Redirect to the appropriate dashboard for their role
      if (isAccessingSeeker || isAccessingProvider || isAccessingAdmin) {
        const dashboardUrl = new URL(`/${userRole}/dashboard`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // For all other cases, allow the request to proceed
    return NextResponse.next();
  },
});

// Helper function to check if a path matches any public route pattern
function isPublicRoute(path: string): boolean {
  return publicRoutes.some(pattern => {
    if (pattern.includes("(.*)")) {
      const regex = new RegExp(`^${pattern.replace("(.*)", ".*")}$`);
      return regex.test(path);
    }
    return pattern === path;
  });
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
