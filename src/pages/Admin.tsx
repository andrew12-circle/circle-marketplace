import { AdminRouteWrapper } from "@/components/admin/AdminRouteWrapper";
import { OptimizedAdminTabs } from "@/components/admin/OptimizedAdminTabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const Admin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useAdminStatus();

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
              // Reload the page to reset state
              window.location.reload();
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
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, services, and system settings with optimized performance.
          </p>
        </div>
        <OptimizedAdminTabs />
      </div>
    </AdminRouteWrapper>
  );
};