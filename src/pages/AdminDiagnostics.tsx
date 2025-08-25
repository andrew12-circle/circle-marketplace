import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { SecureAdminGuard } from '@/components/admin/SecureAdminGuard';
import { SpiritualAdminGuard } from '@/components/admin/SpiritualAdminGuard';
import { PerformanceSystemPanel } from '@/components/admin/PerformanceSystemPanel';
import { DiagnosticsPanel } from '@/components/admin/DiagnosticsPanel';

export default function AdminDiagnostics() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  const isAdmin = profile?.is_admin || false;

  // Show loading while auth is still loading
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Only redirect after we're sure auth and profile have loaded
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SpiritualAdminGuard operation="admin_diagnostics_access">
      <SecureAdminGuard requireElevatedPrivileges={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 shadow-sm">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Button>
                <div className="h-6 w-px bg-slate-300" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900">System Diagnostics</h1>
                    <p className="text-sm text-slate-500">Performance monitoring and system health</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Performance System Panel */}
              <div>
                <PerformanceSystemPanel />
              </div>

              {/* General Diagnostics Panel */}
              <div>
                <DiagnosticsPanel />
              </div>
            </div>
          </div>
        </div>
      </SecureAdminGuard>
    </SpiritualAdminGuard>
  );
}