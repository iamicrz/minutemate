"use client"

export default function RedirectPage() {
  // Redirect immediately using meta refresh
  // This is the most reliable way to redirect without any JavaScript execution
  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/seeker/dashboard" />
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Redirecting to dashboard...</p>
          <p className="text-sm text-muted-foreground">If you are not redirected, <a href="/seeker/dashboard" className="text-primary underline">click here</a></p>
        </div>
      </div>
    </>
  )
}