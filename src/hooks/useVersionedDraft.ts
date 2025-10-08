import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVersionedDraftOptions {
  entityId: string;
  entityType: 'service' | 'vendor';
  autosaveDelay?: number;
  onConflict?: () => void;
}

interface DraftState {
  version_number: number;
  row_version: number;
  state: string;
  payload: any;
}

export function useVersionedDraft({
  entityId,
  entityType,
  autosaveDelay = 5000,
  onConflict
}: UseVersionedDraftOptions) {
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConflictBanner, setShowConflictBanner] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  
  const autosaveTimer = useRef<NodeJS.Timeout>();
  const pendingPayload = useRef<any>(null);

  // Load initial draft
  const loadDraft = useCallback(async () => {
    try {
      const table = entityType === 'service' ? 'service_drafts' : 'vendor_drafts';
      const idField = entityType === 'service' ? 'service_id' : 'vendor_id';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(idField, entityId)
        .in('state', ['DRAFT', 'CHANGES_REQUESTED'])
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDraftState({
          version_number: data.version_number,
          row_version: data.row_version,
          state: data.state,
          payload: data.payload
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: 'Error loading draft',
        description: 'Failed to load your draft. Please refresh the page.',
        variant: 'destructive'
      });
    }
  }, [entityId, entityType, toast]);

  // Save draft with optimistic concurrency
  const saveDraft = useCallback(async (payload: any, immediate = false) => {
    if (!immediate) {
      pendingPayload.current = payload;
      setHasUnsavedChanges(true);
      return;
    }

    setIsSaving(true);
    setShowConflictBanner(false);

    try {
      const rpcFunction = entityType === 'service' ? 'save_service_draft' : 'save_vendor_draft';
      const idParam = entityType === 'service' ? 'p_service_id' : 'p_vendor_id';

      const { data, error } = await supabase.rpc(rpcFunction, {
        [idParam]: entityId,
        p_payload: payload,
        p_row_version: draftState?.row_version || 0
      });

      if (error) {
        if (error.message?.includes('STALE_DRAFT')) {
          setShowConflictBanner(true);
          onConflict?.();
          toast({
            title: 'Draft conflict detected',
            description: 'This draft was modified in another session. Please refresh.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      setDraftState({
        version_number: data.version_number,
        row_version: data.row_version,
        state: data.state,
        payload
      });
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      pendingPayload.current = null;

      toast({
        title: 'Draft saved',
        description: `Version ${data.version_number} saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [entityId, entityType, draftState, onConflict, toast]);

  // Submit draft for review
  const submitDraft = useCallback(async () => {
    try {
      const rpcFunction = entityType === 'service' ? 'submit_service_draft' : 'submit_vendor_draft';
      const idParam = entityType === 'service' ? 'p_service_id' : 'p_vendor_id';

      const { data, error } = await supabase.rpc(rpcFunction, {
        [idParam]: entityId
      });

      if (error) {
        if (error.message?.includes('NO_DRAFT')) {
          toast({
            title: 'No draft to submit',
            description: 'Please save your changes before submitting.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Draft submitted',
        description: 'Your changes have been submitted for review.',
      });

      // Reload to get updated state
      await loadDraft();
    } catch (error) {
      console.error('Error submitting draft:', error);
      toast({
        title: 'Submit failed',
        description: 'Failed to submit draft. Please try again.',
        variant: 'destructive'
      });
    }
  }, [entityId, entityType, loadDraft, toast]);

  // Refresh draft (for conflict resolution)
  const refreshDraft = useCallback(async () => {
    setShowConflictBanner(false);
    await loadDraft();
    toast({
      title: 'Draft refreshed',
      description: 'Loaded the latest version of the draft.',
    });
  }, [loadDraft, toast]);

  // Autosave effect
  useEffect(() => {
    if (hasUnsavedChanges && pendingPayload.current) {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }

      autosaveTimer.current = setTimeout(() => {
        if (pendingPayload.current) {
          saveDraft(pendingPayload.current, true);
        }
      }, autosaveDelay);
    }

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, autosaveDelay, saveDraft]);

  // Load on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  return {
    draftState,
    isSaving,
    hasUnsavedChanges,
    showConflictBanner,
    lastSaved,
    saveDraft,
    submitDraft,
    refreshDraft,
    loadDraft
  };
}
