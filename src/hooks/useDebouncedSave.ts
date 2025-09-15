import { useCallback, useRef } from 'react';
import { useBulletproofSave } from './useBulletproofSave';

const DEBOUNCE_MS = 500;

export function useDebouncedSave() {
  const { save, isSaving, error } = useBulletproofSave();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingChanges = useRef<Map<string, Record<string, any>>>(new Map());

  const debouncedSave = useCallback((serviceId: string, patch: Record<string, any>) => {
    // Merge with any pending changes for this service
    const existing = pendingChanges.current.get(serviceId) || {};
    const merged = { ...existing, ...patch };
    pendingChanges.current.set(serviceId, merged);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      const finalPatch = pendingChanges.current.get(serviceId);
      if (finalPatch) {
        pendingChanges.current.delete(serviceId);
        await save(serviceId, finalPatch);
      }
    }, DEBOUNCE_MS);
  }, [save]);

  const flushPendingSaves = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const saves = Array.from(pendingChanges.current.entries()).map(([serviceId, patch]) =>
      save(serviceId, patch)
    );
    
    pendingChanges.current.clear();
    
    return Promise.all(saves);
  }, [save]);

  const hasPendingChanges = useCallback((serviceId?: string) => {
    if (serviceId) {
      return pendingChanges.current.has(serviceId);
    }
    return pendingChanges.current.size > 0;
  }, []);

  return {
    debouncedSave,
    flushPendingSaves,
    hasPendingChanges,
    isSaving,
    error
  };
}