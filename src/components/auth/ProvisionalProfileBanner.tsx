import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

export const ProvisionalProfileBanner: React.FC = () => {
  const { user, profile } = useAuth();
  
  // Show banner when user exists but no real profile is loaded
  const isProvisional = user && !profile;
  
  if (!isProvisional) return null;

  return (
    <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 mb-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Loading your profile data... Using temporary access while your profile loads.
        </AlertDescription>
      </div>
    </Alert>
  );
};