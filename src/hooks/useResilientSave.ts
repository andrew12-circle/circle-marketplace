import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ResilientSaveOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export const useResilientSave = ({
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 30000
}: ResilientSaveOptions = {}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveQueue, setSaveQueue] = useState<Array<{ id: string; data: any; saveFunc: (data: any) => Promise<any> }>>([]);
  const { toast } = useToast();

  const executeWithTimeout = useCallback(async <T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }, []);

  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    attempt: number = 0
  ): Promise<any> => {
    try {
      return await executeWithTimeout(operation(), timeout);
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        logger.log(`🔄 Save attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(operation, attempt + 1);
      }
      throw error;
    }
  }, [maxRetries, retryDelay, timeout, executeWithTimeout]);

  const save = useCallback(async (
    data: any,
    saveFunction: (data: any) => Promise<any>,
    options: { showSuccessToast?: boolean; queueable?: boolean } = {}
  ) => {
    const { showSuccessToast = true, queueable = false } = options;
    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (queueable && isSaving) {
      // Add to queue if another save is in progress
      setSaveQueue(prev => [...prev, { id: saveId, data, saveFunc: saveFunction }]);
      
      toast({
        title: "Save Queued",
        description: "Your changes will be saved after the current operation completes.",
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);

    try {
      logger.log(`💾 Starting resilient save operation: ${saveId}`);
      
      const result = await retryWithBackoff(() => saveFunction(data));
      
      logger.log(`✅ Save operation completed successfully: ${saveId}`);
      
      if (showSuccessToast) {
        toast({
          title: "Saved Successfully",
          description: "Your changes have been saved.",
          duration: 2000,
        });
      }

      return result;
    } catch (error: any) {
      logger.error(`❌ Save operation failed after ${maxRetries} attempts: ${saveId}`, error);
      
      toast({
        title: "Save Failed",
        description: error?.message || "Unable to save changes. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
    } finally {
      setIsSaving(false);
      
      // Process next item in queue
      setSaveQueue(prev => {
        const [next, ...remaining] = prev;
        if (next) {
          // Process next save after a brief delay
          setTimeout(() => {
            save(next.data, next.saveFunc, { showSuccessToast: false, queueable: false });
          }, 100);
        }
        return remaining;
      });
    }
  }, [isSaving, maxRetries, retryWithBackoff, toast]);

  return {
    save,
    isSaving,
    queueLength: saveQueue.length,
    clearQueue: () => setSaveQueue([])
  };
};