import React, { useEffect, ReactNode } from 'react';
import { useSpiritualCoverage } from '@/contexts/SpiritualCoverageContext';
import { useAuth } from '@/contexts/AuthContext';

interface SpiritualAdminGuardProps {
  children: ReactNode;
  operation?: string;
}

export const SpiritualAdminGuard: React.FC<SpiritualAdminGuardProps> = ({ 
  children, 
  operation = 'admin_panel_access' 
}) => {
  const { applyGuard } = useSpiritualCoverage();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile?.is_admin) {
      const applyAdminProtection = async () => {
        await applyGuard('ADMIN_OPERATIONS', {
          userId: user.id,
          operation,
          adminLevel: profile.is_admin,
          timestamp: new Date().toISOString(),
          protection_type: 'administrative_authority'
        });
      };

      applyAdminProtection();
    }
  }, [user, profile, operation, applyGuard]);

  return <>{children}</>;
};