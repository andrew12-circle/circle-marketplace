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
import { useAutosave } from "@/hooks/useAutosave";
import { updateServiceById, normalizeServiceNumbers } from "@/lib/updateService";
import { diffPatch } from "@/lib/diff";

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
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDefaultPackageId, setSelectedDefaultPackageId] = useState((service as any).default_package_id || null);
  const [currentEditingPackageId, setCurrentEditingPackageId] = useState<string | null>(null);
  const [localPricing, setLocalPricing] = useState({
    retail_price: service.retail_price,
    pro_price: service.pro_price,
    co_pay_price: service.co_pay_price,
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
      retail_price: service.retail_price,
      pro_price: service.pro_price,
      co_pay_price: service.co_pay_price,
      pricing_mode: service.pricing_mode,
      pricing_external_url: service.pricing_external_url,
      pricing_cta_label: service.pricing_cta_label,
      pricing_cta_type: service.pricing_cta_type,
      pricing_note: service.pricing_note
    });
  }, [service.id]);
  
  // Unified autosave system 
  const { triggerAutosave, isSaving, cancelPendingSave } = useAutosave({
    onSave: async (patch: Record<string, any>) => {
      console.log('[ServiceFunnelEditor] Auto-saving patch:', patch);
      
      // Normalize numeric values before saving
      const normalizedPatch = normalizeServiceNumbers(patch);
      
      // Save to database using the clean updateServiceById
      const updatedService = await updateServiceById(service.id, normalizedPatch);
      
      console.log('[ServiceFunnelEditor] Save successful:', updatedService);
      setLastSavedAt(new Date().toISOString());
      setHasChanges(false);
      
      // Update parent with fresh data
      onUpdate({
        ...service,
        ...updatedService
      });
      
      return updatedService;
    },
    onSaved: () => {
      // Invalidate cache after successful save
      invalidateServices();
    },
    delay: 2000, // 2 second debounce for funnel editor
    enabled: true
  });

  // Navigation guard
  useNavigationGuard({
    hasUnsavedChanges: hasChanges || isSaving()
  });

  // Prepare save payload
  const prepareSavePayload = useCallback(() => {
    const normalizedRetailPrice = normalizePrice(localPricing.retail_price);
    const normalizedProPrice = normalizePrice(localPricing.pro_price);
    const normalizedCoPayPrice = normalizePrice(localPricing.co_pay_price);

    dlogPriceTransform('retail_price', localPricing.retail_price, normalizedRetailPrice);
    dlogPriceTransform('pro_price', localPricing.pro_price, normalizedProPrice);
    dlogPriceTransform('co_pay_price', localPricing.co_pay_price, normalizedCoPayPrice);

    return {
      title: service.title,
      description: service.description,
      website_url: service.website_url,
      duration: service.duration,
      setup_time: service.setup_time,
      image_url: service.image_url || service.logo_url,
      price_duration: localPricing.pricing_mode === 'external' ? 'quote' : service.price_duration,
      funnel_content: funnelData,
      pricing_tiers: pricingTiers,
      retail_price: normalizedRetailPrice,
      pro_price: normalizedProPrice,
      co_pay_price: normalizedCoPayPrice,
      default_package_id: selectedDefaultPackageId,
      pricing_mode: localPricing.pricing_mode,
      pricing_external_url: localPricing.pricing_external_url,
      pricing_cta_label: localPricing.pricing_cta_label,
      pricing_cta_type: localPricing.pricing_cta_type,
      pricing_note: localPricing.pricing_note,
      updated_at: new Date().toISOString()
    };
  }, [service, localPricing, funnelData, pricingTiers, selectedDefaultPackageId]);

  const handleSave = async () => {
    if (isSaving()) return;
    
    const payload = prepareSavePayload();
    console.log('[ServiceFunnelEditor] Manual save triggered:', Object.keys(payload));
    
    // Use the new autosave system for immediate save
    triggerAutosave(payload);
    
    toast({
      title: "Saving...", 
      description: "Changes are being saved",
      duration: 1000
    });
  };

  // Handle data changes with autosave
  const handleDataChange = useCallback((section: string, data: any) => {
    setFunnelData(prev => ({
      ...prev,
      [section]: data
    }));
    setHasChanges(true);
    
    // Trigger autosave after data change
    if (service?.id) {
      const payload = prepareSavePayload();
      triggerAutosave(payload);
    }
  }, [service?.id, triggerAutosave, prepareSavePayload]);

  const handlePricingChange = useCallback(async (tiers: any[]) => {
    setPricingTiers(tiers);
    setHasChanges(true);
    
    // Trigger autosave after pricing change
    if (service?.id) {
      const payload = prepareSavePayload();
      triggerAutosave(payload);
    }
  }, [service?.id, triggerAutosave, prepareSavePayload]);

  const handlePricingFieldChange = async (field: string, value: string | number | null) => {
    console.log(`[ServiceFunnelEditor] Pricing field changed: ${field} = ${value}`);
    setLocalPricing(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Trigger autosave after pricing field change
    if (service?.id) {
      const payload = prepareSavePayload();
      triggerAutosave(payload);
    }
  };

  const handleReset = () => {
    setFunnelData(service.funnel_content || {});
    setPricingTiers(service.pricing_tiers || []);
    setLocalPricing({
      retail_price: service.retail_price,
      pro_price: service.pro_price,
      co_pay_price: service.co_pay_price,
      pricing_mode: service.pricing_mode,
      pricing_external_url: service.pricing_external_url,
      pricing_cta_label: service.pricing_cta_label,
      pricing_cta_type: service.pricing_cta_type,
      pricing_note: service.pricing_note
    });
    setSelectedDefaultPackageId((service as any).default_package_id || null);
    setHasChanges(false);
    cancelPendingSave();
    
    toast({
      title: "Reset Complete",
      description: "All changes have been reset to the last saved version"
    });
  };

  // Create preview service object with required fields
  const previewService = {
    ...service,
    funnel_content: funnelData,
    pricing_tiers: pricingTiers,
    default_package_id: selectedDefaultPackageId,
    retail_price: localPricing.retail_price,
    pro_price: localPricing.pro_price,
    co_pay_price: localPricing.co_pay_price,
    pricing_mode: localPricing.pricing_mode,
    pricing_external_url: localPricing.pricing_external_url,
    pricing_cta_label: localPricing.pricing_cta_label,
    pricing_cta_type: localPricing.pricing_cta_type,
    pricing_note: localPricing.pricing_note
  };

  return (
    <div className="space-y-6">
      {/* Save/Preview Controls */}  
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Funnel Editor</h2>
              {hasChanges && !isSaving() && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Unsaved Changes
                </Badge>
              )}
              {isSaving() && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Auto-saving...
                </Badge>
              )}
              {lastSavedAt && !hasChanges && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Saved
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsPreviewOpen(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <Undo className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || isSaving()}
                size="sm"
                variant={lastSavedAt && !hasChanges ? "outline" : "default"}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving() ? 'Saving...' : 
                 lastSavedAt && !hasChanges ? 'Saved' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Editor Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="proof" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Social Proof
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            FAQs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <FunnelSectionEditor 
            sections={funnelData}
            onChange={(sections) => handleDataChange('sections', sections)}
            service={service}
          />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <FunnelMediaEditor 
            media={funnelData.media || []}
            onChange={(media) => handleDataChange('media', media)}
            service={service}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <FunnelPricingEditor
            service={service}
            pricingTiers={pricingTiers}
            onPricingTiersChange={handlePricingChange}
            localPricing={localPricing}
            onPricingFieldChange={handlePricingFieldChange}
            selectedDefaultPackageId={selectedDefaultPackageId}
            onDefaultPackageChange={setSelectedDefaultPackageId}
            onCurrentEditingPackageChange={setCurrentEditingPackageId}
          />
        </TabsContent>

        <TabsContent value="proof" className="space-y-4">
          <FunnelProofEditor 
            socialProof={funnelData.socialProof || { testimonials: [], stats: [] }}
            onChange={(socialProof) => handleDataChange('socialProof', socialProof)}
            service={service}
          />
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <FunnelFAQEditor 
            faqs={funnelData.faqs || []}
            onChange={(faqs) => handleDataChange('faqs', faqs)}
            service={service}
          />
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <ServiceFunnelModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        service={previewService}
        requestedId={currentEditingPackageId}
      />
    </div>
  );
};