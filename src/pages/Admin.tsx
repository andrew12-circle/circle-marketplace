import AdminDashboard from "@/pages/AdminDashboard";
import { AdminRouteWrapper } from "@/components/admin/AdminRouteWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const Admin = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Admin useEffect triggered:', { user: !!user, profile: !!profile, isLoading });
    
    const checkAdminStatus = async () => {
      if (!user) {
        console.log('No user found, stopping loading');
        setIsLoading(false);
        return;
      }

      // PRIORITY 1: Check email allowlist FIRST - instant admin access for known users
      const adminEmails = ['robert@circlenetwork.io', 'andrew@circlenetwork.io'];
      if (user.email && adminEmails.includes(user.email)) {
        console.log('Admin status confirmed via email allowlist (priority check)');
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      // PRIORITY 2: Check profile data if available
      if (profile?.is_admin === true) {
        console.log('Admin status confirmed via profile');
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      // PRIORITY 3: Only try RPC for non-allowlisted users with minimal timeout
      try {
        console.log('Checking admin status for user:', user.id);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Admin check timeout')), 500); // Very short timeout
        });
        
        // Try direct admin check first
        const adminCheckPromise = supabase
          .rpc('admin_self_check_enhanced')
          .single();
        
        const { data: adminData, error: adminError } = await Promise.race([
          adminCheckPromise, 
          timeoutPromise
        ]) as any;
        
        if (!adminError && adminData && (adminData as any)?.profile_data?.is_admin) {
          console.log('Admin status confirmed via direct check');
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // Final fallback to regular RPC
        const regularRpcPromise = supabase.rpc('get_user_admin_status');
        const { data, error } = await Promise.race([regularRpcPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(!!profile?.is_admin);
        } else {
          console.log('Admin status result:', data);
          setIsAdmin(data || false);
        }
      } catch (error) {
        console.error('Admin check error:', error);
        // Final fallback to profile data
        setIsAdmin(!!profile?.is_admin);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading with fallback logic
    const timeoutId = setTimeout(() => {
      console.log('Admin check timeout - forcing loading to false');
      // Strong fallback: check if user is in admin allowlist
      if (user?.email) {
        const adminEmails = ['robert@circlenetwork.io', 'andrew@circlenetwork.io'];
        if (adminEmails.includes(user.email)) {
          console.log('Admin access granted via email allowlist');
          setIsAdmin(true);
        } else {
          // Use profile data as final fallback
          setIsAdmin(!!profile?.is_admin);
        }
      } else {
        setIsAdmin(!!profile?.is_admin);
      }
      setIsLoading(false);
    }, 1000); // Ultra-fast timeout since email allowlist is checked first

    checkAdminStatus();

    return () => clearTimeout(timeoutId);
  }, [user, profile, toast]);

  // Handle cache refresh callback
  const handleCacheRefresh = () => {
    // Trigger marketplace data refresh
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
          <button 
            onClick={() => {
              console.log('Force recovery clicked');
              setIsLoading(false);
              // Try to recover auth context
              if (typeof window !== 'undefined' && (window as any).authRecovery) {
                (window as any).authRecovery();
              }
            }}
            className="text-xs text-primary hover:text-primary/80 underline"
          >
            If stuck, click here to recover
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Administrator privileges required to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminRouteWrapper>
      <AdminDashboard />
    </AdminRouteWrapper>
  );
};