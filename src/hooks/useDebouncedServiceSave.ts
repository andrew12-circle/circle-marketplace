import { useCallback, useRef } from 'react';
import { useUnifiedServiceSave } from './useUnifiedServiceSave';

interface UseDebouncedServiceSaveOptions {
  debounceMs?: number;
  onSaveSuccess?: (serviceId: string, result: any) => void;
  onSaveError?: (serviceId: string, error: any) => void;
  autoSave?: boolean;
}

export function useDebouncedServiceSave(options: UseDebouncedServiceSaveOptions = {}) {
  const {
    debounceMs = 2000,
    autoSave = true,
    ...unifiedOptions
  } = options;

  const { save: unifiedSave, ...saveState } = useUnifiedServiceSave(unifiedOptions);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingChangesRef = useRef<Map<string, Record<string, any>>>(new Map());
  
  const debouncedSave = useCallback((
    serviceId: string, 
    patch: Record<string, any>,
    source = 'debounced-save'
  ) => {
    // Merge with existing pending changes for this service
    const existingPatch = pendingChangesRef.current.get(serviceId) || {};
    const mergedPatch = { ...existingPatch, ...patch };
    pendingChangesRef.current.set(serviceId, mergedPatch);
    
    // Mark as changed immediately for UI feedback
    saveState.markChanged();
    
    if (!autoSave) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      const finalPatch = pendingChangesRef.current.get(serviceId);
      if (finalPatch) {
        pendingChangesRef.current.delete(serviceId);
        try {
          await unifiedSave(serviceId, finalPatch, source);
        } catch (error) {
          // Error is already handled by useUnifiedServiceSave
          console.error('[useDebouncedServiceSave] Auto-save failed:', error);
        }
      }
    }, debounceMs);
  }, [unifiedSave, debounceMs, autoSave, saveState]);
  
  const saveImmediately = useCallback(async (serviceId: string, patch?: Record<string, any>) => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Get pending changes if no patch provided
    const finalPatch = patch || pendingChangesRef.current.get(serviceId);
    if (finalPatch) {
      pendingChangesRef.current.delete(serviceId);
      return await unifiedSave(serviceId, finalPatch, 'immediate-save');
    }
  }, [unifiedSave]);
  
  const flushPendingSaves = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const saves = Array.from(pendingChangesRef.current.entries()).map(([serviceId, patch]) =>
      unifiedSave(serviceId, patch, 'flush-save')
    );
    
    pendingChangesRef.current.clear();
    
    return Promise.allSettled(saves);
  }, [unifiedSave]);
  
  const hasPendingChanges = useCallback((serviceId?: string) => {
    if (serviceId) {
      return pendingChangesRef.current.has(serviceId);
    }
    return pendingChangesRef.current.size > 0;
  }, []);
  
  const cancelPendingSave = useCallback((serviceId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pendingChangesRef.current.delete(serviceId);
    saveState.cancelPendingSaves(serviceId);
  }, [saveState]);

  return {
    debouncedSave,
    saveImmediately,
    flushPendingSaves,
    hasPendingChanges,
    cancelPendingSave,
    ...saveState
  };
}