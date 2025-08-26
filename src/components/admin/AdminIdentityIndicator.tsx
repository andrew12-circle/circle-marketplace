import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';

export const AdminIdentityIndicator: React.FC = () => {
  const { user } = useAuth();
  const { data: isAdmin } = useAdminStatus();

  if (!user || !isAdmin) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="text-xs">
        Admin
      </Badge>
      <span>
        {user.email} • {user.id.slice(0, 8)}...
      </span>
    </div>
  );
};