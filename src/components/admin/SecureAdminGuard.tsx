import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecureAdminGuardProps {
  children: ReactNode;
  requireElevatedPrivileges?: boolean;
}

export const SecureAdminGuard: React.FC<SecureAdminGuardProps> = ({ 
  children, 
  requireElevatedPrivileges = false 
}) => {
  const { user, profile, loading } = useAuth();
  const [securityVerified, setSecurityVerified] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  useEffect(() => {
    const verifyAdminSecurity = async () => {
      // Wait for auth to fully load before making decisions
      if (loading) {
        return;
      }
      
      // Only proceed with verification if we have a user and admin status
      if (!user || !profile?.is_admin) {
        console.log('SecureAdminGuard: User or admin status check failed', { 
          hasUser: !!user, 
          isAdmin: profile?.is_admin,
          profileLoaded: !!profile 
        });
        setVerificationLoading(false);
        return;
      }

      try {
        // Verify admin session and security context
        const { data, error } = await supabase.rpc('validate_admin_session_context');
        
        if (error) throw error;
        
        if (!data) {
          setSecurityError('Admin session validation failed. Please log out and log back in.');
          return;
        }

        // Log the admin dashboard access
        await supabase.rpc('log_admin_operation_secure', {
          operation_type: 'dashboard_access',
          target_user_id: user.id,
          operation_data: {
            elevated_privileges: requireElevatedPrivileges,
            access_time: new Date().toISOString()
          }
        });

        setSecurityVerified(true);
      } catch (error) {
        console.error('Admin security verification failed:', error);
        setSecurityError(
          error instanceof Error 
            ? error.message 
            : 'Failed to verify admin security context'
        );
      } finally {
        setVerificationLoading(false);
      }
    };

    verifyAdminSecurity();
  }, [user, profile, loading, requireElevatedPrivileges]);

  if (loading || verificationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 animate-spin" />
          <span>Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (securityError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Verification Failed:</strong> {securityError}
            <br />
            <br />
            For security reasons, you have been denied access. Please contact a system administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!securityVerified) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Security verification in progress. Please wait...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};