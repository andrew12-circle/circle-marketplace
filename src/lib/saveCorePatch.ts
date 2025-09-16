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
  // Field mapping: convert common field names to allowlist names
  const fieldMapping: Record<string, string> = {
    'logo_url': 'image_url', // map logo_url to image_url which is in allowlist
    'profile_image_url': 'image_url', // map profile_image_url to image_url
    'time_to_results': 'duration', // map time_to_results to duration
    'pricing_packages': 'pricing_tiers' // map pricing_packages to pricing_tiers
  };

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
    
    // Use field mapping if available
    const mappedKey = fieldMapping[key] || key;
    sanitized[mappedKey] = value;
  }

  // Skip empty patches
  if (Object.keys(sanitized).length === 0) {
    console.log('[saveCorePatch] Empty patch after sanitization, skipping');
    throw new Error('No valid fields to update');
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
      payloadKeys: Object.keys(payload.p_patch),
      payload
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