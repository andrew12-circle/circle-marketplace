import { useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AutosaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutosave = ({ onSave, delay = 3000, enabled = true }: AutosaveOptions) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  const savingRef = useRef(false);

  const triggerAutosave = useCallback(async (data: any) => {
    if (!enabled || savingRef.current) return;

    const dataString = JSON.stringify(data);
    if (dataString === lastDataRef.current) return;

    // Clear any pending saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (savingRef.current) return;
      
      savingRef.current = true;
      try {
        logger.log('🔄 Autosave triggered');
        await onSave(data);
        lastDataRef.current = dataString;
        
        toast({
          title: "Changes Saved",
          description: "Your work has been automatically saved.",
          duration: 2000,
        });
      } catch (error) {
        logger.error('❌ Autosave failed:', error);
        toast({
          title: "Autosave Failed",
          description: "Changes couldn't be saved automatically. Please save manually.",
          variant: "destructive",
          duration: 4000,
        });
      } finally {
        savingRef.current = false;
      }
    }, delay);
  }, [onSave, delay, enabled, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    triggerAutosave,
    isSaving: () => savingRef.current,
    cancelPendingSave: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };
};