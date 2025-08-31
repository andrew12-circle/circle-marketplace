
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cacheManager } from '@/utils/cacheManager';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AutoRecoverySystemProps {
  isError: boolean;
  errorCount: number;
  onRecoveryComplete: () => void;
}

export const AutoRecoverySystem: React.FC<AutoRecoverySystemProps> = ({
  isError,
  errorCount,
  onRecoveryComplete
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [hasAutoRecovered, setHasAutoRecovered] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-trigger recovery on first error, but only once per session
    if (isError && errorCount >= 1 && !hasAutoRecovered && !isRecovering) {
      performAutoRecovery();
    }
  }, [isError, errorCount, hasAutoRecovered, isRecovering]);

  const performAutoRecovery = async () => {
    if (isRecovering || hasAutoRecovered) return;
    
    setIsRecovering(true);
    setHasAutoRecovered(true);

    try {
      // Show user-friendly message
      toast({
        title: "Our apologies, we hit a snag",
        description: "Let me refresh the system for you...",
        duration: 3000,
      });

      console.log('🔧 Auto-recovery: Clearing cache while preserving session...');
      
      // Clear cache but preserve authentication
      await cacheManager.clearAllCachePreserveSession();
      
      // Wait a moment for cache to clear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force refresh marketplace data
      sessionStorage.setItem('forceFreshData', '1');
      
      // Notify parent component that recovery is complete
      onRecoveryComplete();
      
      toast({
        title: "System refreshed successfully",
        description: "Everything should be working smoothly now!",
        duration: 2000,
      });

      console.log('✅ Auto-recovery completed successfully');
      
    } catch (error) {
      console.error('❌ Auto-recovery failed:', error);
      
      toast({
        title: "Recovery attempt failed",
        description: "Please try refreshing the page manually.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleManualRecovery = () => {
    performAutoRecovery();
  };

  // Show recovery UI only if auto-recovery failed or user wants manual control
  if (!isError || isRecovering) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            System Recovery Available
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            {hasAutoRecovered 
              ? "We attempted to fix the issue automatically. If problems persist, try a manual refresh."
              : "We can automatically clear the cache and refresh the system to resolve this issue."}
          </p>
          <Button
            onClick={handleManualRecovery}
            variant="outline"
            size="sm"
            className="mt-3 bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-50"
            disabled={isRecovering}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Refreshing System...' : 'Refresh System'}
          </Button>
        </div>
      </div>
    </div>
  );
};
