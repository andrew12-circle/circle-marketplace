import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';

interface AccountLockoutAlertProps {
  isLocked: boolean;
  timeRemainingSeconds: number;
  attemptsRemaining: number;
}

export const AccountLockoutAlert = ({ 
  isLocked, 
  timeRemainingSeconds, 
  attemptsRemaining 
}: AccountLockoutAlertProps) => {
  const [timeLeft, setTimeLeft] = useState(timeRemainingSeconds);

  useEffect(() => {
    setTimeLeft(timeRemainingSeconds);
  }, [timeRemainingSeconds]);

  useEffect(() => {
    if (!isLocked || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Reload the page when lockout expires to allow login attempts
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLocked) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            Account temporarily locked due to multiple failed attempts. 
            Try again in <strong>{formatTime(timeLeft)}</strong>.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (attemptsRemaining <= 2 && attemptsRemaining > 0) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> {attemptsRemaining} login attempts remaining before account lockout.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};