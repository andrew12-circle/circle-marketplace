// lib/profile.ts
import { Database } from '@/integrations/supabase/types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export function getProStatus(p?: Partial<Profile> | null) {
  if (!p) return false
  return Boolean(p.is_pro || p.is_pro_member)
}