import { AdminRouteWrapper } from "@/components/admin/AdminRouteWrapper";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminContentRouter } from "@/components/admin/AdminContentRouter";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between px-4 h-full">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger>
                    <Menu className="h-4 w-4" />
                  </SidebarTrigger>
                  <div>
                    <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => window.location.href = '/marketplace'}
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
    </AdminRouteWrapper>
  );
};