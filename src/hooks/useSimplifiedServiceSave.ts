import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SimplifiedSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useSimplifiedServiceSave() {
  const [saveState, setSaveState] = useState<SimplifiedSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null
  });
  
  const { toast } = useToast();
  
  // Save pricing data separately (lightweight)
  const savePricingOnly = useCallback(async (serviceId: string, pricingData: any) => {
    setSaveState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      console.log('[SimplifiedSave] Saving pricing data only:', Object.keys(pricingData));
      
      const { error } = await supabase
        .from('services')
        .update({
          pricing_tiers: pricingData.pricing_tiers || [],
          retail_price: pricingData.retail_price,
          pro_price: pricingData.pro_price,
          co_pay_price: pricingData.co_pay_price,
          default_package_id: pricingData.default_package_id,
          pricing_mode: pricingData.pricing_mode,
          pricing_external_url: pricingData.pricing_external_url,
          pricing_cta_label: pricingData.pricing_cta_label,
          pricing_cta_type: pricingData.pricing_cta_type,
          pricing_note: pricingData.pricing_note,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      setSaveState({
        isSaving: false,
        lastSaved: new Date(),
        error: null
      });
      
      toast({
        title: "Pricing Saved",
        description: "Pricing data saved successfully",
        duration: 2000
      });
      
      return { ok: true };
    } catch (error: any) {
      console.error('[SimplifiedSave] Pricing save failed:', error);
      setSaveState({
        isSaving: false,
        lastSaved: null,
        error: error.message
      });
      
      toast({
        title: "Pricing Save Failed",
        description: error.message,
        variant: "destructive",
        duration: 3000
      });
      
      return { ok: false, error: error.message };
    }
  }, [toast]);
  
  // Save funnel content separately (heavier)
  const saveFunnelOnly = useCallback(async (serviceId: string, funnelData: any) => {
    setSaveState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      console.log('[SimplifiedSave] Saving funnel content only');
      
      const { error } = await supabase
        .from('services')
        .update({
          funnel_content: funnelData,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      setSaveState({
        isSaving: false,
        lastSaved: new Date(),
        error: null
      });
      
      toast({
        title: "Content Saved",
        description: "Funnel content saved successfully",
        duration: 2000
      });
      
      return { ok: true };
    } catch (error: any) {
      console.error('[SimplifiedSave] Funnel save failed:', error);
      setSaveState({
        isSaving: false,
        lastSaved: null,
        error: error.message
      });
      
      toast({
        title: "Content Save Failed",
        description: error.message,
        variant: "destructive",
        duration: 3000
      });
      
      return { ok: false, error: error.message };
    }
  }, [toast]);
  
  // Save basic service fields (lightest)
  const saveServiceFields = useCallback(async (serviceId: string, serviceData: any) => {
    setSaveState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      console.log('[SimplifiedSave] Saving service fields only:', Object.keys(serviceData));
      
      const { error } = await supabase
        .from('services')
        .update({
          title: serviceData.title,
          description: serviceData.description,
          website_url: serviceData.website_url,
          duration: serviceData.duration,
          setup_time: serviceData.setup_time,
          image_url: serviceData.image_url,
          logo_url: serviceData.logo_url,
          price_duration: serviceData.price_duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      setSaveState({
        isSaving: false,
        lastSaved: new Date(),
        error: null
      });
      
      toast({
        title: "Fields Saved",
        description: "Service fields saved successfully",
        duration: 2000
      });
      
      return { ok: true };
    } catch (error: any) {
      console.error('[SimplifiedSave] Service fields save failed:', error);
      setSaveState({
        isSaving: false,
        lastSaved: null,
        error: error.message
      });
      
      toast({
        title: "Fields Save Failed",
        description: error.message,
        variant: "destructive",
        duration: 3000
      });
      
      return { ok: false, error: error.message };
    }
  }, [toast]);
  
  return {
    savePricingOnly,
    saveFunnelOnly,
    saveServiceFields,
    isSaving: saveState.isSaving,
    lastSaved: saveState.lastSaved,
    error: saveState.error
  };
}