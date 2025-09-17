import { useState, useEffect, useRef } from 'react';
import { diff, SaveResult } from '@/lib/serviceSaveHelpers';
import { useToast } from '@/hooks/use-toast';

export interface UseVersionedAutosaveOptions<T> {
  value: T;
  version: number;
  saveFn: (patch: Partial<T>, version: number) => Promise<SaveResult>;
  onVersionUpdate?: (newVersion: number) => void;
  debounceMs?: number;
}

export function useVersionedAutosave<T extends object>({
  value,
  version,
  saveFn,
  onVersionUpdate,
  debounceMs = 800
}: UseVersionedAutosaveOptions<T>) {
  const [prev, setPrev] = useState(value);
  const [currentVersion, setCurrentVersion] = useState(version);
  const [isSaving, setIsSaving] = useState(false);
  const [showConflictBanner, setShowConflictBanner] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Update version when it changes externally
  useEffect(() => {
    setCurrentVersion(version);
  }, [version]);

  useEffect(() => {
    const patch = diff(value, prev);
    
    console.log('[useVersionedAutosave] Change detection:', { 
      hasChanges: Object.keys(patch).length > 0,
      patch,
      currentValue: value,
      previousValue: prev,
      patchKeys: Object.keys(patch)
    });
    
    if (Object.keys(patch).length === 0) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      console.log('[useVersionedAutosave] Starting save with patch:', patch);
      setIsSaving(true);
      try {
        const result = await saveFn(patch, currentVersion);
        console.log('[useVersionedAutosave] Save completed:', result);
        setPrev(value);
        setCurrentVersion(result.version);
        onVersionUpdate?.(result.version);
        setShowConflictBanner(false);
      } catch (error: any) {
        console.error('[useVersionedAutosave] Save failed:', error);
        if (error.message === 'VERSION_CONFLICT') {
          setShowConflictBanner(true);
        } else {
          toast({
            title: "Save Failed",
            description: error.message || "Failed to save changes",
            variant: "destructive"
          });
        }
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, currentVersion, saveFn, onVersionUpdate, debounceMs, prev, toast]);

  const refreshAndRetry = async () => {
    try {
      // User needs to refresh the data externally
      setShowConflictBanner(false);
      toast({
        title: "Refresh Required",
        description: "Please refresh the page to get the latest version"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed", 
        description: "Please refresh the page manually",
        variant: "destructive"
      });
    }
  };

  return {
    isSaving,
    showConflictBanner,
    refreshAndRetry,
    version: currentVersion
  };
}