
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RESPADisclaimer {
  id: string;
  title: string;
  content: string;
  button_text: string;
  button_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useActiveDisclaimer = () => {
  const query = useQuery({
    queryKey: ["respa_disclaimer", "active-latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("respa_disclaimers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data || null) as RESPADisclaimer | null;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 15 * 60 * 1000, // 15 min
  });

  return {
    disclaimer: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
