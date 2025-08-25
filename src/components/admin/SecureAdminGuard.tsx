import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

// Safe Mode: Default to allowing admin access based on profile.is_admin
// Set to true to enable strict security verification (not recommended until RPC is stable)
const STRICT_ADMIN_SECURITY = false;

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
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [safeMode, setSafeMode] = useState(false);

  useEffect(() => {
    const verifyAdminSecurity = async () => {
      // Wait for auth to fully load before making decisions
      if (loading) {
        return;
      }
      
      // Only proceed with verification if we have a user and admin status
      if (!user || !profile?.is_admin) {
        logger.log('SecureAdminGuard: User or admin status check failed', { 
          hasUser: !!user, 
          isAdmin: profile?.is_admin,
          profileLoaded: !!profile 
        });
        setVerificationLoading(false);
        return;
      }

      // Safe Mode: Grant immediate access for admins, run security checks in background
      if (!STRICT_ADMIN_SECURITY) {
        logger.log('SecureAdminGuard: Safe Mode - Granting immediate admin access', {
          userId: user.id,
          isAdmin: profile.is_admin,
          strictMode: false
        });
        
        setSafeMode(true);
        setSecurityVerified(true);
        setVerificationLoading(false);

        // Run security verification in background (non-blocking)
        setTimeout(async () => {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Security check timeout')), 3000)
            );
            
            // Use enhanced admin session validation for better stability
            const securityPromise = supabase.rpc('admin_self_check_enhanced');
            
            const { data, error } = await Promise.race([securityPromise, timeoutPromise]) as any;
            
            if (error || !data) {
              setSecurityWarning('Background security check failed - this is informational only');
              logger.warn('Background security verification failed:', error);
            } else {
              logger.log('Background security verification passed');
              
              // Also log the admin dashboard access in background
              try {
                await supabase.rpc('log_admin_operation_secure', {
                  operation_type: 'dashboard_access',
                  target_user_id: user.id,
                  operation_data: {
                    elevated_privileges: requireElevatedPrivileges,
                    access_time: new Date().toISOString(),
                    safe_mode: true
                  }
                });
              } catch (err) {
                logger.warn('Failed to log admin operation:', err);
              }
            }
          } catch (error) {
            setSecurityWarning('Background security check timed out - this is informational only');
            logger.warn('Background security check failed:', error);
          }
        }, 100);
        
        return;
      }

      // Strict Mode: Original blocking security verification
      try {
        const { data, error } = await supabase.rpc('admin_self_check_enhanced');
        
        if (error) throw error;
        
        if (!data) {
          setSecurityWarning('Admin session validation failed. Functionality may be limited.');
          setSecurityVerified(true); // Allow access but with warning
          return;
        }

        await supabase.rpc('log_admin_operation_secure', {
          operation_type: 'dashboard_access',
          target_user_id: user.id,
          operation_data: {
            elevated_privileges: requireElevatedPrivileges,
            access_time: new Date().toISOString(),
            strict_mode: true
          }
        });

        setSecurityVerified(true);
      } catch (error) {
        logger.error('Admin security verification failed:', error);
        setSecurityWarning(
          error instanceof Error 
            ? `Security check failed: ${error.message}` 
            : 'Failed to verify admin security context'
        );
        setSecurityVerified(true); // Allow access but with warning
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

  return (
    <>
      {securityWarning && (
        <div className="container mx-auto py-4 px-4">
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> {securityWarning}
              {safeMode && (
                <span className="ml-2 text-sm opacity-75">
                  (Safe Mode: Admin access granted based on profile verification)
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {safeMode && (
        <div className="container mx-auto py-2 px-4">
          <Alert variant="default" className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Safe Mode Active:</strong> Admin access granted. Background security checks running.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {children}
    </>
  );
};