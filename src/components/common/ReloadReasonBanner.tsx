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
        return 'Circle worked some magic to keep everything running smoothly! ✨';
      case 'cookie_recovery':
        return 'We refreshed your session - you\'re still logged in and ready to go! ☕';
      case 'version_update':
        return 'Circle just got better! We updated a few things for you. 🚀';
      case 'recovery_fallback':
        return 'Oops, our apologies! We smoothed that out. Your session is safe and sound! 💫';
      case 'manual':
        return 'Fresh start! Everything\'s loaded and ready for you. ⭐';
      case 'session_recovery':
        return 'We noticed a little hiccup and fixed it right up. Welcome back! 🎯';
      default:
        return 'All set! Circle is running perfectly for you now. ✅';
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