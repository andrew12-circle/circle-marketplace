import { supabase } from '@/integrations/supabase/client';

/**
 * Unified service update helper to eliminate inline Supabase calls and type casting
 */
export async function updateServiceById(id: string, patch: Record<string, any>) {
  console.log('[updateServiceById] Updating service:', { id, patchKeys: Object.keys(patch) });
  
  // Filter out undefined values to prevent database errors
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([_, value]) => value !== undefined)
  );
  
  if (Object.keys(cleanPatch).length === 0) {
    throw new Error('No valid fields to update');
  }
  
  const { data, error } = await supabase
    .from('services')
    .update(cleanPatch)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('[updateServiceById] Update failed:', error);
    throw error;
  }
  
  console.log('[updateServiceById] Update successful');
  return data;
}

/**
 * Toggle service boolean fields (verified, active, affiliate, booking)
 */
export async function toggleServiceField(id: string, field: string, value: boolean) {
  console.log('[toggleServiceField] Toggling:', { id, field, value });
  
  return await updateServiceById(id, { 
    [field]: value,
    updated_at: new Date().toISOString()
  });
}

/**
 * Normalize numeric values to prevent NaN/undefined database errors
 */
export function normalizeServiceNumbers(data: Record<string, any>) {
  const normalized = { ...data };
  
  // Handle ROI - allow high values up to 10000%
  if (typeof normalized.estimated_roi === 'number') {
    normalized.estimated_roi = Math.min(10000, Math.max(0, normalized.estimated_roi));
  }
  
  // Handle RESPA split limits
  if (typeof normalized.respa_split_limit === 'number') {
    normalized.respa_split_limit = Math.min(1000, Math.max(0, Math.round(normalized.respa_split_limit)));
  }
  
  // Handle non-SSP percentages
  if (typeof normalized.max_split_percentage_non_ssp === 'number') {
    normalized.max_split_percentage_non_ssp = Math.min(1000, Math.max(0, Math.round(normalized.max_split_percentage_non_ssp)));
  }
  
  return normalized;
}