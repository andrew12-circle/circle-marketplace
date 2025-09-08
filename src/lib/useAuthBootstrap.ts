import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Session } from "@supabase/supabase-js"
import { logGuardDecision } from "@/lib/diagnostics"

type Boot = "loading" | "ready"

export function useAuthBootstrap() {
  const [status, setStatus] = useState<Boot>("loading")
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let mounted = true
    
    const initialize = async () => {
      logGuardDecision("auth bootstrap started", { mounted })
      
      try {
        // Get current session first
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        
        const currentSession = data.session ?? null
        setSession(currentSession)
        setStatus("ready")
        
        logGuardDecision("initial session check complete", { 
          hasSession: !!currentSession,
          userId: currentSession?.user?.id 
        })
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return
          setSession(session)
          logGuardDecision("auth state changed", { 
            event: _event,
            hasSession: !!session,
            userId: session?.user?.id 
          })
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Auth bootstrap error:", error)
        if (mounted) {
          setStatus("ready") // Still set to ready to avoid blocking
          logGuardDecision("auth bootstrap error", { error: error.message })
        }
      }
    }

    const cleanup = initialize()
    
    return () => { 
      mounted = false
      cleanup?.then(fn => fn?.())
    }
  }, [])

  return { status, session }
}