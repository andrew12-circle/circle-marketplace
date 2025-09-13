import { supabase } from "@/integrations/supabase/client";

export async function updateServiceResilient(id: string, patch: any, signal: AbortSignal): Promise<void> {
  // Filter out any undefined values that might cause issues
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([_, value]) => value !== undefined)
  );

  // Backoff retry loop
  for (let i = 0; i < 3; i++) {
    if (signal.aborted) throw new Error('Update cancelled');
    
    try {
      const { error } = await supabase
        .from('services')
        .update(cleanPatch)
        .eq('id', id);
      
      if (error) throw error;
      return; // Success
    } catch (e: any) {
      if (signal.aborted) throw e;
      if (i === 2) throw e; // Last attempt
      
      // Exponential backoff: 250ms, 500ms, 1000ms
      await new Promise(r => setTimeout(r, 250 * (2 ** i)));
    }
  }
}