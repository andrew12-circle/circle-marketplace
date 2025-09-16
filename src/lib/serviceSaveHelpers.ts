import { supabase } from "@/integrations/supabase/client";

export interface SaveResult {
  id: string;
  version: number;
  updated_at: string;
}

// Helper to calculate diff between objects
export function diff<T extends object>(next: T, prev: T): Partial<T> {
  const out: any = {};
  for (const k of Object.keys(next)) {
    if (JSON.stringify((next as any)[k]) !== JSON.stringify((prev as any)[k])) {
      out[k] = (next as any)[k];
    }
  }
  return out;
}

// Save core service fields (title, description, prices, toggles)
export async function saveCorePatch(
  id: string, 
  patch: Record<string, any>, 
  version: number
): Promise<SaveResult> {
  const { data, error } = await supabase.rpc('svc_save_core_patch', {
    p_id: id,
    p_patch: patch,
    p_version: version
  });
  
  if (error) {
    if (error.message?.includes('VERSION_CONFLICT')) {
      throw new Error('VERSION_CONFLICT');
    }
    throw error;
  }
  
  return {
    id: data[0].id,
    version: data[0].version,
    updated_at: data[0].updated_at
  };
}

// Save funnel content only
export async function saveFunnelPatch(
  id: string, 
  patch: Record<string, any>, 
  version: number
): Promise<SaveResult> {
  const { data, error } = await supabase.rpc('svc_save_funnel_patch', {
    p_id: id,
    p_patch: patch,
    p_version: version
  });
  
  if (error) {
    if (error.message?.includes('VERSION_CONFLICT')) {
      throw new Error('VERSION_CONFLICT');
    }
    throw error;
  }
  
  return {
    id: data[0].id,
    version: data[0].version,
    updated_at: data[0].updated_at
  };
}