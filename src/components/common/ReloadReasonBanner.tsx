import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, RefreshCw, Settings } from 'lucide-react';

export const ReloadReasonBanner = () => {
  const [reloadReason, setReloadReason] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const reason = sessionStorage.getItem('last_reload_reason');
    if (reason) {
      setReloadReason(reason);
      setIsVisible(true);
      // Clear the reason so it doesn't show again
      sessionStorage.removeItem('last_reload_reason');
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const getReloadMessage = (reason: string) => {
    switch (reason) {
      case 'self_heal':
        return 'App reloaded automatically to fix detected issues.';
      case 'version_update':
        return 'App reloaded due to version update.';
      case 'manual':
        return 'App was manually reloaded.';
      default:
        return 'App was reloaded.';
    }
  };

  const getIcon = (reason: string) => {
    switch (reason) {
      case 'self_heal':
        return <AlertTriangle className="w-4 h-4" />;
      case 'version_update':
        return <Settings className="w-4 h-4" />;
      case 'manual':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  if (!isVisible || !reloadReason) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="shadow-lg border-l-4 border-l-blue-500 bg-blue-50/90 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getIcon(reloadReason)}
            <AlertDescription className="text-sm font-medium">
              {getReloadMessage(reloadReason)}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-blue-100"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};