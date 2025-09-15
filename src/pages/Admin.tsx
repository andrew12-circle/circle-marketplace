import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminContentRouter } from "@/components/admin/AdminContentRouter";
import { Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ServiceEditorErrorBoundary } from "@/lib/errorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { SecureAdminGuard } from "@/components/admin/SecureAdminGuard";
import { AdminAuthWrapper } from "@/components/admin/AdminAuthWrapper";
import { EditModeToggle } from "@/components/admin/EditModeToggle";

const Admin = () => {
  const { user } = useAuth();

  return (
    <AdminAuthWrapper>
      <SecureAdminGuard>
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
                      <EditModeToggle />
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
      </SecureAdminGuard>
    </AdminAuthWrapper>
  );
};

export default Admin;