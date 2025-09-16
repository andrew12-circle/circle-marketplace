import { useState, useCallback, useRef } from 'react';
import { serviceSaveCoordinator } from '@/lib/serviceSaveCoordinator';
import { useToast } from '@/hooks/use-toast';
import { useInvalidateMarketplace } from '@/hooks/useMarketplaceData';

interface SaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
}

interface UseUnifiedServiceSaveOptions {
  onSaveSuccess?: (serviceId: string, result: any) => void;
  onSaveError?: (serviceId: string, error: any) => void;
  autoInvalidateCache?: boolean;
  showToasts?: boolean;
}

export function useUnifiedServiceSave(options: UseUnifiedServiceSaveOptions = {}) {
  const {
    onSaveSuccess,
    onSaveError,
    autoInvalidateCache = true,
    showToasts = true
  } = options;

  const [saveState, setSaveState] = useState<SaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
    hasUnsavedChanges: false
  });

  const { toast } = useToast();
  const { invalidateServices } = useInvalidateMarketplace();
  
  // Track original data for change detection
  const originalDataRef = useRef<Record<string, any>>({});
  
  const save = useCallback(async (
    serviceId: string, 
    patch: Record<string, any>, 
    source = 'unified-hook'
  ) => {
    setSaveState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      const result = await serviceSaveCoordinator.save(serviceId, patch, source);
      
      if (result.ok && !result.skipped) {
        setSaveState({
          isSaving: false,
          lastSaved: new Date(),
          error: null,
          hasUnsavedChanges: false
        });
        
        // Update original data reference
        originalDataRef.current = { ...originalDataRef.current, ...patch };
        
        if (showToasts) {
          toast({
            title: "Saved",
            description: "Changes saved successfully",
            duration: 2000
          });
        }
        
        if (autoInvalidateCache) {
          // Debounce cache invalidation to avoid excessive calls
          setTimeout(() => invalidateServices(), 100);
        }
        
        onSaveSuccess?.(serviceId, result);
      } else if (result.skipped) {
        setSaveState(prev => ({ 
          ...prev, 
          isSaving: false, 
          hasUnsavedChanges: false 
        }));
      }
      
      return result;
    } catch (error: any) {
      setSaveState({
        isSaving: false,
        lastSaved: null,
        error: error.message || 'Save failed',
        hasUnsavedChanges: true
      });
      
      if (showToasts) {
        toast({
          title: "Save Failed",
          description: error.message || "Failed to save changes",
          variant: "destructive",
          duration: 5000
        });
      }
      
      onSaveError?.(serviceId, error);
      
      // Don't throw error - let UI continue working
      console.error(`[useUnifiedServiceSave] Save failed for ${serviceId}:`, error);
      return { ok: false, error: error.message };
    }
  }, [toast, invalidateServices, autoInvalidateCache, showToasts, onSaveSuccess, onSaveError]);
  
  const markChanged = useCallback(() => {
    setSaveState(prev => ({ ...prev, hasUnsavedChanges: true, error: null }));
  }, []);
  
  const setOriginalData = useCallback((data: Record<string, any>) => {
    originalDataRef.current = { ...data };
    setSaveState(prev => ({ ...prev, hasUnsavedChanges: false }));
  }, []);
  
  const hasChanges = useCallback((currentData: Record<string, any>): boolean => {
    const original = originalDataRef.current;
    
    for (const [key, value] of Object.entries(currentData)) {
      if (JSON.stringify(original[key]) !== JSON.stringify(value)) {
        return true;
      }
    }
    
    return false;
  }, []);
  
  const getSaveStatus = useCallback((serviceId: string) => {
    return serviceSaveCoordinator.getSaveStatus(serviceId);
  }, []);
  
  const cancelPendingSaves = useCallback((serviceId: string) => {
    serviceSaveCoordinator.cancelPendingSaves(serviceId);
    setSaveState(prev => ({ ...prev, isSaving: false }));
  }, []);

  return {
    save,
    saveState,
    markChanged,
    setOriginalData,
    hasChanges,
    getSaveStatus,
    cancelPendingSaves,
    // Convenience getters
    isSaving: saveState.isSaving,
    lastSaved: saveState.lastSaved,
    error: saveState.error,
    hasUnsavedChanges: saveState.hasUnsavedChanges
  };
}