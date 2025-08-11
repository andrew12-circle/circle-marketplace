import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function fetchServiceCount(): Promise<number> {
  const { count, error } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export function useServiceCount() {
  return useQuery({
    queryKey: ['services', 'count'],
    queryFn: fetchServiceCount,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
