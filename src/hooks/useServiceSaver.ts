import { useRef, useCallback } from "react";
import { globalSaveQueue } from "@/lib/saveQueue";

export function useServiceSaver(updateFn: (id: string, patch: any, signal: AbortSignal) => Promise<void>) {
  const abortRef = useRef<AbortController | null>(null);

  const save = useCallback((id: string, patch: any) => {
    // Cancel any in-flight save for this row
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    globalSaveQueue.enqueue(async () => {
      if (ctl.signal.aborted) return;
      await updateFn(id, patch, ctl.signal);
    });
  }, [updateFn]);

  return { 
    save, 
    cancel: () => abortRef.current?.abort() 
  };
}