import { useState, useCallback } from 'react';
import { bulletproofSave, SaveResult } from '@/lib/bulletproofSave';
import { useToast } from '@/hooks/use-toast';

export interface SaveState {
  isSaving: boolean;
  lastResult: SaveResult | null;
  error: string | null;
}

export function useBulletproofSave() {
  const [saveState, setSaveState] = useState<SaveState>({
    isSaving: false,
    lastResult: null,
    error: null
  });
  
  const { toast } = useToast();
  
  const save = useCallback(async (serviceId: string, patch: Record<string, any>, expectedVersion?: number) => {
    setSaveState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      const result = await bulletproofSave(serviceId, patch, expectedVersion);
      
      setSaveState({
        isSaving: false,
        lastResult: result,
        error: result.ok ? null : result.error || 'Save failed'
      });
      
      if (result.ok) {
        toast({
          title: "Saved",
          description: `Changes saved successfully (${result.traceId})`,
          duration: 2000
        });
      } else {
        toast({
          title: "Save Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive",
          duration: 5000
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveState({
        isSaving: false,
        lastResult: null,
        error: errorMessage
      });
      
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
      
      return {
        ok: false,
        traceId: 'unknown',
        error: errorMessage
      };
    }
  }, [toast]);
  
  return {
    save,
    ...saveState
  };
}