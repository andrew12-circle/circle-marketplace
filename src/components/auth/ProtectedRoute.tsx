import { Navigate } from "react-router-dom"
import { useAuthBootstrap } from "@/lib/useAuthBootstrap"
import { logGuardDecision } from "@/lib/diagnostics"

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status, session } = useAuthBootstrap()
  
  if (status === "loading") {
    logGuardDecision("protected route loading", { path: window.location.pathname })
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading your session…</div>
      </div>
    )
  }
  
  if (!session) {
    logGuardDecision("protected route redirect", { 
      path: window.location.pathname,
      hasSession: false,
      reason: "no_session"
    })
    return <Navigate to="/auth" replace />
  }
  
  logGuardDecision("protected route authorized", { 
    path: window.location.pathname,
    hasSession: true,
    userId: session.user?.id
  })
  
  return children
}