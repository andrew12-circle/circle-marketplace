import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidateMarketplace, QUERY_KEYS } from "@/hooks/useMarketplaceData";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { FunnelSectionEditor } from "./FunnelSectionEditor";
import { FunnelMediaEditor } from "./FunnelMediaEditor";
import { FunnelPricingEditor } from "./FunnelPricingEditor";
import { normalizePrice, dlogPriceTransform } from "@/utils/priceNormalization";
import { FunnelFAQEditor } from "./FunnelFAQEditor";
import { FunnelProofEditor } from "./FunnelProofEditor";
import { 
  Eye, 
  Save, 
  Undo, 
  FileText, 
  Image, 
  DollarSign, 
  MessageSquare, 
  HelpCircle,
  Settings
} from "lucide-react";
import { ServiceFunnelModal } from "@/components/marketplace/ServiceFunnelModal";
import { useVersionedAutosave } from '@/hooks/useVersionedAutosave';
import { saveFunnelPatch } from '@/lib/serviceSaveHelpers';

interface Service {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  logo_url?: string;
  profile_image_url?: string;
  website_url?: string;
  duration?: string;
  setup_time?: string;
  price_duration?: string;
  funnel_content?: any;
  pricing_tiers?: any[];
  pricing_mode?: string;
  pricing_external_url?: string;
  pricing_cta_label?: string;
  pricing_cta_type?: string;
  pricing_note?: string;
  category?: string;
  is_featured?: boolean;
  is_top_pick?: boolean;
  retail_price?: string | null;
  pro_price?: string | null;
  co_pay_price?: string | null;
  core_version?: number;
  funnel_version?: number;
  vendor?: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    website_url?: string;
    logo_url?: string;
  };
}

interface ServiceFunnelEditorProps {
  service: Service;
  onUpdate: (updatedService: Service) => void;
}

export const ServiceFunnelEditor = ({ service, onUpdate }: ServiceFunnelEditorProps) => {
  const [funnelData, setFunnelData] = useState(service.funnel_content || {});
  const [pricingTiers, setPricingTiers] = useState(service.pricing_tiers || []);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDefaultPackageId, setSelectedDefaultPackageId] = useState((service as any).default_package_id || null);
  const [currentEditingPackageId, setCurrentEditingPackageId] = useState<string | null>(null);
  const [localPricing, setLocalPricing] = useState({
    pricing_mode: service.pricing_mode,
    pricing_external_url: service.pricing_external_url,
    pricing_cta_label: service.pricing_cta_label,
    pricing_cta_type: service.pricing_cta_type,
    pricing_note: service.pricing_note
  });

  const { toast } = useToast();
  const { invalidateServices } = useInvalidateMarketplace();
  const queryClient = useQueryClient();
  
  // Sync local state when service prop changes
  useEffect(() => {
    setFunnelData(service.funnel_content || {});
    setPricingTiers(service.pricing_tiers || []);
    setSelectedDefaultPackageId((service as any).default_package_id || null);
    setLocalPricing({
      pricing_mode: service.pricing_mode,
      pricing_external_url: service.pricing_external_url,
      pricing_cta_label: service.pricing_cta_label,
      pricing_cta_type: service.pricing_cta_type,
      pricing_note: service.pricing_note
    });
  }, [service.id]);
  
  // Versioned autosave for funnel content only (NOT pricing tiers)
  const { isSaving, showConflictBanner, refreshAndRetry } = useVersionedAutosave({
    value: { funnel_content: funnelData },
    version: service.funnel_version || 1,
    saveFn: async (patch, version) => {
      console.log('[Funnel Autosave] Saving patch:', { serviceId: service.id, patch, version });
      console.log('[Funnel Autosave] Current funnelData:', funnelData);
      console.log('[Funnel Autosave] Current pricingTiers:', pricingTiers);
      console.log('[Funnel Autosave] Patch contains pricing_tiers?', 'pricing_tiers' in patch);
      
      // Check if patch is empty or meaningless
      const hasRealChanges = Object.keys(patch).some(key => {
        const value = patch[key];
        return value != null && value !== '' && JSON.stringify(value) !== '{}' && JSON.stringify(value) !== '[]';
      });
      
      if (!hasRealChanges) {
        console.log('[Funnel Autosave] Skipping save - no meaningful changes detected');
        return { id: service.id, version, updated_at: new Date().toISOString() };
      }
      
      // Save only funnel fields using RPC
      const result = await saveFunnelPatch(service.id, patch, version);
      
      // Update the parent component with the changes
      onUpdate({ ...service, ...patch, funnel_version: result.version });
      
      console.log('[Funnel Autosave] Save completed successfully');
      
      return result;
    },
    onVersionUpdate: (newVersion) => {
      onUpdate({ ...service, funnel_version: newVersion });
    }
  });

  // Navigation guard
  useNavigationGuard({
    hasUnsavedChanges: isSaving
  });

  // Handle funnel data changes
  const handleDataChange = useCallback((key: string, value: any) => {
    setFunnelData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle pricing changes via parent update (not autosave)
  const handlePricingChange = useCallback(async (tiers: any[]) => {
    console.log('[ServiceFunnelEditor] handlePricingChange called:', { 
      newTiersCount: tiers.length, 
      currentTiersCount: pricingTiers.length,
      tiers 
    });
    setPricingTiers(tiers);
    
    // Update parent immediately with new pricing tiers
    const updatedService = { ...service, pricing_tiers: tiers };
    onUpdate(updatedService);
    
    console.log('[ServiceFunnelEditor] Updated parent with new pricing tiers');
  }, [service, onUpdate, pricingTiers.length]);

  // Handle pricing field changes
  const handlePricingFieldChange = useCallback(async (field: string, value: string | number) => {
    // Handle duration and setup_time as funnel content fields
    if (field === 'duration' || field === 'setup_time') {
      const currentFunnelContent = funnelData || {};
      const updatedFunnelContent = {
        ...currentFunnelContent,
        [field]: value
      };
      handleDataChange('funnel_content', updatedFunnelContent);
    } else {
      // Handle other pricing fields normally
      setLocalPricing(prev => ({ ...prev, [field]: value }));
    }
  }, [funnelData, handleDataChange]);

  // Create preview service object with required fields
  const previewService = {
    ...service,
    category: service.category || 'general',
    is_featured: service.is_featured || false,
    is_top_pick: service.is_top_pick || false,
    vendor: service.vendor || {
      name: '',
      rating: 0,
      review_count: 0,
      is_verified: false
    },
    funnel_content: funnelData,
    pricing_tiers: pricingTiers,
    retail_price: service.retail_price,
    pro_price: service.pro_price,
    co_pay_price: service.co_pay_price,
    pricing_mode: localPricing.pricing_mode,
    pricing_external_url: localPricing.pricing_external_url,
    pricing_cta_label: localPricing.pricing_cta_label,
    pricing_cta_type: localPricing.pricing_cta_type,
    pricing_note: localPricing.pricing_note
  } as any;

  return (
    <div className="space-y-6">
      {showConflictBanner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-yellow-800">Version Conflict</h4>
              <p className="text-sm text-yellow-700">
                This service has been updated by another user. Please refresh to get the latest version.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAndRetry}
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Service Funnel Editor</CardTitle>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                Saving...
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="proof" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Social Proof
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <FunnelSectionEditor 
            data={{
              // Map service fields to expected FunnelSectionEditor field names
              title: service.title,
              description: service.description,
              website_url: service.website_url,
              duration: (service.funnel_content?.duration && service.funnel_content.duration !== '30 days') 
                ? service.funnel_content.duration 
                : (service.duration && service.duration !== '30 days') 
                  ? service.duration 
                  : 'TBD',
              setup_time: service.funnel_content?.setup_time || service.setup_time,
              image_url: service.image_url,
              logo_url: service.logo_url,
              profile_image_url: service.profile_image_url,
              // Map funnel content fields with proper field name handling
              headline: service.funnel_content?.headline || service.title,
              subHeadline: service.funnel_content?.subheadline || service.funnel_content?.subHeadline || service.description
            }}
            onChange={(data) => {
              // Handle core service fields that need auto-save
              const coreFields = ['title', 'description', 'website_url', 'duration', 'setup_time', 'image_url', 'logo_url', 'profile_image_url'];
              const coreUpdates: any = {};
              
              // Extract core service fields
              coreFields.forEach(field => {
                if (data[field] !== undefined) {
                  coreUpdates[field] = data[field];
                }
              });
              
              // Handle funnel content fields (headline, subHeadline, duration, setup_time)
              if (data.headline !== undefined || data.subHeadline !== undefined || data.duration !== undefined || data.setup_time !== undefined) {
                const currentFunnelContent = funnelData || {};
                const updatedFunnelContent = {
                  ...currentFunnelContent,
                  ...(data.headline !== undefined && { headline: data.headline }),
                  ...(data.subHeadline !== undefined && { subheadline: data.subHeadline }),
                  ...(data.duration !== undefined && { duration: data.duration }),
                  ...(data.setup_time !== undefined && { setup_time: data.setup_time })
                };
                handleDataChange('funnel_content', updatedFunnelContent);
              }
              
              // Save core fields if any exist
              if (Object.keys(coreUpdates).length > 0) {
                onUpdate({ ...service, ...coreUpdates });
              }
            }}
            onPricingChange={handlePricingFieldChange}
          />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <FunnelMediaEditor 
            media={funnelData.media || []}
            onChange={(media) => handleDataChange('media', media)}
            serviceImageUrl={service.image_url || service.logo_url}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <FunnelPricingEditor
            pricingTiers={pricingTiers}
            onChange={handlePricingChange}
            pricingMode={localPricing.pricing_mode}
            pricingExternalUrl={localPricing.pricing_external_url}
            pricingCtaLabel={localPricing.pricing_cta_label}
            pricingCtaType={localPricing.pricing_cta_type}
            pricingNote={localPricing.pricing_note}
            onPricingFieldChange={handlePricingFieldChange}
          />
        </TabsContent>

        <TabsContent value="proof" className="space-y-4">
          <FunnelProofEditor 
            proofData={funnelData.socialProof || { 
              testimonials: { enabled: false, items: [] }, 
              caseStudy: { enabled: false, data: {} }, 
              vendorVerification: { enabled: false, data: { badges: [], description: '' } } 
            }}
            onChange={(proofData) => handleDataChange('socialProof', proofData)}
          />
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <FunnelFAQEditor 
            faqSections={funnelData.faqs || []}
            onChange={(faqSections) => handleDataChange('faqs', faqSections)}
          />
        </TabsContent>
      </Tabs>

      <ServiceFunnelModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        service={previewService}
      />
    </div>
  );
};