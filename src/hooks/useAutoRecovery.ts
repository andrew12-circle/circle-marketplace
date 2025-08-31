
import { useCallback, useState, useEffect } from 'react';
import { cacheManager } from '@/utils/cacheManager';
import { useToast } from '@/hooks/use-toast';

interface UseAutoRecoveryOptions {
  enabled?: boolean;
  errorThreshold?: number;
  autoTriggerDelay?: number;
}

interface UseAutoRecoveryReturn {
  triggerRecovery: () => Promise<void>;
  isRecovering: boolean;
  recoveryCount: number;
  canAutoRecover: boolean;
}

export const useAutoRecovery = (options: UseAutoRecoveryOptions = {}): UseAutoRecoveryReturn => {
  const {
    enabled = true,
    errorThreshold = 1,
    autoTriggerDelay = 2000
  } = options;

  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryCount, setRecoveryCount] = useState(0);
  const [lastRecoveryTime, setLastRecoveryTime] = useState<number>(0);
  const { toast } = useToast();

  // Prevent too frequent recoveries (max once per 30 seconds)
  const canAutoRecover = enabled && (Date.now() - lastRecoveryTime) > 30000;

  const triggerRecovery = useCallback(async () => {
    if (isRecovering || !canAutoRecover) return;

    setIsRecovering(true);
    setLastRecoveryTime(Date.now());

    try {
      console.log('🔧 [Auto-Recovery] Starting system recovery...');

      // Show user-friendly notification
      toast({
        title: "Our apologies, we hit a snag",
        description: "Let me refresh the system for you...",
        duration: 3000,
      });

      // Clear cache but preserve session
      await cacheManager.clearAllCachePreserveSession();
      
      // Mark that we want fresh data
      sessionStorage.setItem('forceFreshData', '1');
      sessionStorage.setItem('lastAutoRecovery', Date.now().toString());

      // Small delay to ensure cache is cleared
      await new Promise(resolve => setTimeout(resolve, 500));

      setRecoveryCount(prev => prev + 1);

      toast({
        title: "System refreshed",
        description: "Everything should be working smoothly now!",
        duration: 2000,
      });

      console.log('✅ [Auto-Recovery] Recovery completed successfully');

    } catch (error) {
      console.error('❌ [Auto-Recovery] Recovery failed:', error);
      
      toast({
        title: "Recovery failed",
        description: "Please refresh the page manually if issues persist.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRecovering(false);
    }
  }, [isRecovering, canAutoRecover, toast]);

  return {
    triggerRecovery,
    isRecovering,
    recoveryCount,
    canAutoRecover
  };
};
