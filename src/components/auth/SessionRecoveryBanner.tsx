import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Shield, Coffee, Sparkles } from 'lucide-react';

interface SessionRecoveryBannerProps {
  onRetry?: () => void;
}

export const SessionRecoveryBanner = ({ onRetry }: SessionRecoveryBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [recoveryReason, setRecoveryReason] = useState<string>('');

  useEffect(() => {
    const reason = sessionStorage.getItem('session_recovery_reason');
    if (reason) {
      setRecoveryReason(reason);
      setIsVisible(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.removeItem('session_recovery_reason');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.removeItem('session_recovery_reason');
  };

  const getRecoveryMessage = (reason: string) => {
    switch (reason) {
      case 'session_restore':
        return "Hey there! We noticed a hiccup and got you back on track. You're all set! ☕";
      case 'token_refresh':
        return "Just refreshed your session for you - Circle's got your back! ✨";
      case 'auth_recovery':
        return "Oops, our apologies! We fixed that right up. Welcome back to Circle! 🚀";
      case 'general_recovery':
        return "We smoothed out a little bump for you. Everything's running perfectly now! 💫";
      default:
        return "Circle worked some magic to keep you connected. You're all good! ⭐";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
      <Alert className="shadow-xl border-l-4 border-l-primary bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-primary/20 rounded-full">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <AlertDescription className="text-sm font-medium text-foreground">
              {getRecoveryMessage(recoveryReason)}
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
        {onRetry && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRetry();
                handleDismiss();
              }}
              className="h-7 text-xs"
            >
              Retry Action
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};