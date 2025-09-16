import type { SupabaseClient } from '@supabase/supabase-js';

type Json = Record<string, any>;

interface SaveResult {
  id: string;
  version: number;
  updated_at: string;
}

export async function saveCorePatch(
  supabase: SupabaseClient,
  args: { id: string; patch: Json; version: number }
): Promise<SaveResult> {
  // Skip empty patches
  if (Object.keys(args.patch).length === 0) {
    console.log('[saveCorePatch] Empty patch, skipping');
    throw new Error('No valid fields to update');
  }

  // Sanitize patch
  const sanitized: Json = {};
  for (const [key, value] of Object.entries(args.patch)) {
    if (value === undefined) continue;
    if (typeof value === 'number' && Number.isNaN(value)) { 
      sanitized[key] = null; 
      continue; 
    }
    if (value === '') { 
      sanitized[key] = null; 
      continue; 
    }
    sanitized[key] = value;
  }

  // IMPORTANT: use the exact SQL arg names
  const payload = {
    p_id: args.id,
    p_patch: sanitized,
    p_version: args.version,
  };

  console.log('[saveCorePatch] Calling RPC with payload:', {
    id: payload.p_id,
    patchKeys: Object.keys(payload.p_patch),
    version: payload.p_version
  });

  const { data, error } = await supabase.rpc('svc_save_core_patch', payload);
  
  if (error) {
    console.error('svc_save_core_patch failed', {
      code: error.code, 
      message: error.message, 
      details: error.details, 
      hint: error.hint, 
      payloadKeys: Object.keys(payload.p_patch)
    });
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.error('svc_save_core_patch returned no data');
    throw new Error('Save operation returned no data');
  }

  return {
    id: data[0].id,
    version: data[0].version,
    updated_at: data[0].updated_at
  };
}