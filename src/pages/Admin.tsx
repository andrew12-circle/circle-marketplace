import { AdminDashboard } from "@/components/admin/AdminDashboard";
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
    const checkAdminStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_user_admin_status');
        
        if (error) {
          console.error('Error checking admin status:', error);
          toast({
            title: "Access Check Failed",
            description: "Unable to verify admin privileges",
            variant: "destructive"
          });
          setIsAdmin(false);
        } else {
          setIsAdmin(data || false);
        }
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, toast]);

  // Handle cache refresh callback
  const handleCacheRefresh = () => {
    // Trigger marketplace data refresh
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
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
    <div className="container mx-auto py-6">
      <AdminDashboard onCacheRefresh={handleCacheRefresh} />
    </div>
  );
};