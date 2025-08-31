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
      case 'cookie_recovery':
        return 'App reloaded to fix authentication cookies. You remain logged in.';
      case 'version_update':
        return 'App reloaded due to version update.';
      case 'recovery_fallback':
        return 'App reloaded using fallback recovery. Your session is preserved.';
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
      case 'cookie_recovery':
        return <Settings className="w-4 h-4 text-primary" />;
      case 'recovery_fallback':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
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

  const getBannerStyle = (reason: string) => {
    switch (reason) {
      case 'cookie_recovery':
        return 'border-l-primary bg-primary/10 backdrop-blur-sm';
      case 'recovery_fallback':
        return 'border-l-destructive bg-destructive/10 backdrop-blur-sm';
      case 'self_heal':
        return 'border-l-yellow-500 bg-yellow-500/10 backdrop-blur-sm';
      default:
        return 'border-l-primary bg-primary/10 backdrop-blur-sm';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className={`shadow-lg border-l-4 ${getBannerStyle(reloadReason)}`}>
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
            className="h-6 w-6 p-0 hover:bg-primary/20"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};