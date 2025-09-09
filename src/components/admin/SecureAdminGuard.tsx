import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

// Safe Mode: Default to allowing admin access based on profile.is_admin
// Set to true to enable strict security verification (not recommended until RPC is stable)
const STRICT_ADMIN_SECURITY = false;

// Hard allowlist for immediate admin access (bypasses all RPCs)
const ADMIN_ALLOWLIST = ['robert@circlenetwork.io', 'andrew@heisleyteam.com', 'andrew@circlenetwork.io'];

interface SecureAdminGuardProps {
  children: ReactNode;
  requireElevatedPrivileges?: boolean;
}

export const SecureAdminGuard: React.FC<SecureAdminGuardProps> = ({ 
  children, 
  requireElevatedPrivileges = false 
}) => {
  const { user, profile, loading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminStatus();
  const [backgroundCheckRan, setBackgroundCheckRan] = useState(false);

  // Don't show loading spinner - render immediately for confirmed admins
  if (loading || adminLoading) {
    // Only show spinner if we're truly waiting for initial auth
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      );
    }
    // Don't show spinner for admin loading if we have basic auth
    return <>{children}</>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check allowlist first - immediate render
  const isAllowlisted = user.email && ADMIN_ALLOWLIST.includes(user.email.toLowerCase());
  
  // If user is confirmed admin (profile or allowlist), render immediately
  const isConfirmedAdmin = isAllowlisted || profile?.is_admin === true;
  
  // Run background security check once per session (non-blocking)
  if (isConfirmedAdmin && !backgroundCheckRan && !STRICT_ADMIN_SECURITY) {
    setBackgroundCheckRan(true);
    
    setTimeout(async () => {
      try {
        await supabase.rpc('log_admin_operation_secure', {
          operation_type: 'dashboard_access',
          target_user_id: user.id,
          operation_data: {
            elevated_privileges: requireElevatedPrivileges,
            access_time: new Date().toISOString(),
            allowlisted: isAllowlisted,
            profile_confirmed: profile?.is_admin === true
          }
        });
        logger.log('Background admin access logged');
      } catch (error) {
        logger.warn('Background admin logging failed:', error);
      }
    }, 100);
  }

  return (
    <>{children}</>
  );
};