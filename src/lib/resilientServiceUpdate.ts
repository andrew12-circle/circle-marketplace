import { supabase } from "@/integrations/supabase/client";

export async function updateServiceResilient(id: string, patch: any, signal: AbortSignal): Promise<any> {
  const startTime = performance.now();
  console.log('[resilientServiceUpdate] Starting update', { id, patchKeys: Object.keys(patch) });
  
  // Filter out any undefined values that might cause issues
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(cleanPatch).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Backoff retry loop
  for (let i = 0; i < 3; i++) {
    if (signal.aborted) throw new Error('Update cancelled');
    
    try {
      const { data, error, status } = await supabase
        .from('services')
        .update(cleanPatch)
        .eq('id', id)
        .select()
        .single()
        .throwOnError();
      
      if (error) throw error;
      if (status < 200 || status >= 300) {
        throw new Error(`Unexpected status ${status}`);
      }
      
      const duration = Math.round(performance.now() - startTime);
      console.log('[resilientServiceUpdate] Success', { id, duration, status });
      return data; // Return the updated row data
    } catch (e: any) {
      if (signal.aborted) throw e;
      if (i === 2) {
        const duration = Math.round(performance.now() - startTime);
        console.error('[resilientServiceUpdate] Final failure', { id, duration, error: e.message });
        throw e; // Last attempt
      }
      
      console.log(`[resilientServiceUpdate] Attempt ${i + 1} failed, retrying...`, { id, error: e.message });
      // Exponential backoff: 250ms, 500ms, 1000ms
      await new Promise(r => setTimeout(r, 250 * (2 ** i)));
    }
  }
}