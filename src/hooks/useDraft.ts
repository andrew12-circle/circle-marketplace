import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

interface DraftOptions<T> {
  key: string;
  initialData?: T;
  enabled?: boolean;
}

export const useDraft = <T>({ key, initialData, enabled = true }: DraftOptions<T>) => {
  const [draftData, setDraftData] = useState<T | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const stored = localStorage.getItem(`draft:${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraftData(parsed);
        setHasDraft(true);
        logger.log('📝 Draft loaded from localStorage', { key });
      }
    } catch (error) {
      logger.warn('Failed to load draft from localStorage', { key, error });
      clearDraft();
    }
  }, [key, enabled]);

  // Save draft to localStorage
  const saveDraft = useCallback((data: T) => {
    if (!enabled) return;
    
    try {
      localStorage.setItem(`draft:${key}`, JSON.stringify(data));
      setDraftData(data);
      setHasDraft(true);
      logger.log('💾 Draft saved to localStorage', { key });
    } catch (error) {
      logger.warn('Failed to save draft to localStorage', { key, error });
    }
  }, [key, enabled]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (!enabled) return;
    
    try {
      localStorage.removeItem(`draft:${key}`);
      setDraftData(null);
      setHasDraft(false);
      logger.log('🗑️ Draft cleared from localStorage', { key });
    } catch (error) {
      logger.warn('Failed to clear draft from localStorage', { key, error });
    }
  }, [key, enabled]);

  // Get merged data (draft takes precedence over initial)
  const getMergedData = useCallback((): T | null => {
    if (draftData) return draftData;
    return initialData || null;
  }, [draftData, initialData]);

  return {
    draftData,
    hasDraft,
    saveDraft,
    clearDraft,
    getMergedData,
  };
};