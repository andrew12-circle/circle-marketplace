import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminContentRouter } from "@/components/admin/AdminContentRouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ServiceEditorErrorBoundary } from "@/lib/errorBoundary";
import { logGuardDecision } from "@/lib/diagnostics";
import { Session } from "@supabase/supabase-js";

const Admin = () => {
  // ProtectedRoute already handles auth, so we just get the session
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

  // Check admin status
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-status', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      
      // Client-side admin allowlist for known admins
      const adminEmails = ['andrew@circlenetwork.io', 'andrew@heisleyteam.com'];
      if (session.user.email && adminEmails.includes(session.user.email)) {
        logGuardDecision('admin status allowlist match', { email: session.user.email });
        return true;
      }
      
      // Check via RPC
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

  return (
    <ServiceEditorErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full" data-testid="admin-content">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between px-4 h-full">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger>
                    <Menu className="h-4 w-4" />
                  </SidebarTrigger>
                  <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {session.user?.email}
                  </span>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Marketplace</span>
                  </button>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <AdminContentRouter />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ServiceEditorErrorBoundary>
  );
};

export default Admin;