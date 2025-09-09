import React, { useState, useEffect } from "react";
import { OptimizedAdminTabs } from "@/components/admin/OptimizedAdminTabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { logGuardDecision } from "@/lib/diagnostics";
import { Session } from "@supabase/supabase-js";

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enhanced admin gating logic
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      
      // First check profile.is_admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', session.user.id)
        .single();
      
      if (!profileError && profile?.is_admin === true) {
        logGuardDecision('admin status profile match', { userId: session.user.id });
        return true;
      }
      
      // Try enhanced admin check RPC
      try {
        const { data: enhancedCheck, error: enhancedError } = await supabase.rpc('admin_self_check_enhanced');
        if (!enhancedError && enhancedCheck?.admin_checks?.any_admin_method === true) {
          logGuardDecision('admin status enhanced RPC match', { userId: session.user.id });
          return true;
        }
      } catch (error) {
        console.warn('Enhanced admin check failed, trying fallback:', error);
      }
      
      // Fallback to basic admin status check
      const { data, error } = await supabase.rpc('get_user_admin_status');
      if (error) {
        console.warn('Admin status check failed:', error);
        return false;
      }
      return !!data;
    },
    enabled: !!session?.user?.id,
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });

  // Show loading while checking admin status
  if (!session || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Verifying permissions...</span>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    logGuardDecision('admin page access denied', { 
      path: '/admin', 
      userId: session.user.id,
      email: session.user.email
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              Administrator privileges required to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  logGuardDecision('admin page authorized', { 
    path: '/admin', 
    userId: session.user.id 
  });

  return <OptimizedAdminTabs />;
};

export default Admin;