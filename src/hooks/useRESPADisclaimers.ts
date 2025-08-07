import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useRESPADisclaimers = () => {
  const [disclaimers, setDisclaimers] = useState<RESPADisclaimer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDisclaimers = async (activeOnly: boolean = true) => {
    try {
      setLoading(true);
      let query = supabase
        .from('respa_disclaimers')
        .select('*');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setDisclaimers(data || []);
    } catch (error) {
      console.error('Error fetching RESPA disclaimers:', error);
      toast({
        title: "Error",
        description: "Failed to load RESPA disclaimers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceDisclaimer = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          disclaimer_id,
          respa_disclaimers (
            id,
            title,
            content,
            button_text,
            button_url,
            is_active
          )
        `)
        .eq('id', serviceId)
        .maybeSingle();

      if (error) throw error;
      return data?.respa_disclaimers || null;
    } catch (error) {
      console.error('Error fetching service disclaimer:', error);
      return null;
    }
  };

  const updateDisclaimer = async (id: string, updates: Partial<RESPADisclaimer>) => {
    try {
      const { error } = await supabase
        .from('respa_disclaimers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Disclaimer updated successfully",
      });
      
      fetchDisclaimers();
    } catch (error) {
      console.error('Error updating disclaimer:', error);
      toast({
        title: "Error",
        description: "Failed to update disclaimer",
        variant: "destructive",
      });
    }
  };

  const createDisclaimer = async (disclaimer: Omit<RESPADisclaimer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('respa_disclaimers')
        .insert(disclaimer);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Disclaimer created successfully",
      });
      
      fetchDisclaimers();
    } catch (error) {
      console.error('Error creating disclaimer:', error);
      toast({
        title: "Error",
        description: "Failed to create disclaimer",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDisclaimers();
  }, []);

  return {
    disclaimers,
    loading,
    updateDisclaimer,
    createDisclaimer,
    fetchServiceDisclaimer,
    refetch: fetchDisclaimers
  };
};