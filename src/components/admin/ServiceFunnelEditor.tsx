
import { useState, useEffect, useCallback } from "react";
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
import { useDebouncedServiceSave } from "@/hooks/useDebouncedServiceSave";
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
  // Add pricing fields
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
  const { toast } = useToast();
  const { invalidateServices } = useInvalidateMarketplace();
  const queryClient = useQueryClient();
  
  // Unified save system with debouncing and coordination
  const {
    debouncedSave,
    saveImmediately,
    isSaving,
    hasUnsavedChanges,
    lastSaved
  } = useDebouncedServiceSave({
    debounceMs: 3000,
    autoSave: true,
    onSaveSuccess: (serviceId, result) => {
      console.log('[ServiceFunnelEditor] Save successful:', result);
      setHasChanges(false);
      setLastSavedAt(new Date().toISOString());
      toast({
        title: "Saved Successfully", 
        description: "All changes have been saved",
        duration: 2000
      });
      onUpdate(service); // Trigger parent update
    },
    onSaveError: (serviceId, error) => {
      console.error('[ServiceFunnelEditor] Save failed:', error);
      toast({
        title: "Save Failed",
        description: "Please try again",
        variant: "destructive",
        duration: 3000
      });
    }
  });
  
  // Navigation guard
  useNavigationGuard({
    hasUnsavedChanges: hasChanges || hasUnsavedChanges || isSaving
  });

  // Initialize default funnel content if none exists
  useEffect(() => {
    if (!service.funnel_content) {
      const defaultFunnel = {
        headline: service.title,
        subHeadline: "Transform your real estate business with our proven system",
        media: [],
        benefits: [
          {
            title: "Increase Lead Generation",
            description: "Generate more qualified leads with proven strategies",
            icon: "TrendingUp"
          },
          {
            title: "Save Time",
            description: "Automate your workflow and focus on closing deals",
            icon: "Clock"
          },
          {
            title: "Boost Revenue",
            description: "Increase your conversion rates and average deal size",
            icon: "DollarSign"
          }
        ],
        testimonials: [
          {
            name: "Sarah M.",
            title: "Keller Williams",
            content: "Doubled my leads in 60 days. The automation saves me 15 hours per week!",
            rating: 5
          }
        ],
        stats: [
          { value: "600%", label: "Avg ROI", icon: "TrendingUp" },
          { value: "30", label: "Days Setup", icon: "Clock" },
          { value: "24/7", label: "Support", icon: "Trophy" }
        ],
        proofItWorks: {
          testimonials: {
            enabled: true,
            items: [
              {
                id: "testimonial-1",
                name: "Sarah M.",
                company: "Keller Williams",
                content: "Doubled my leads in 60 days. The automation saves me 15 hours per week!",
                rating: 5
              }
            ]
          },
          caseStudy: {
            enabled: true,
            data: {
              beforeValue: 12,
              afterValue: 85,
              beforeLabel: "leads/month",
              afterLabel: "leads/month",
              percentageIncrease: 608,
              timeframe: "90 Days",
              description: "Real agent results from Q3 2024"
            }
          },
          vendorVerification: {
            enabled: true,
            data: {
              badges: ["Background checked", "Performance verified"],
              description: "This vendor has been vetted and meets our quality standards."
            }
          }
        },
        faqSections: [
          {
            id: "question-1",
            title: "Why Should I Care?",
            content: service.description || "All-in-one real estate lead generation & CRM platform designed to turn online leads into closings faster"
          },
          {
            id: "question-2", 
            title: "What's My ROI Potential?",
            content: "600% average return on investment with proper implementation"
          }
        ],
        callToAction: {
          title: "Ready to Transform Your Business?",
          description: "Join thousands of agents who've already made the switch",
          buttonText: "Book Your Free Demo",
          buttonVariant: "default"
        }
      };
      setFunnelData(defaultFunnel);
    }
  }, [service]);

  // Helper: enforce a max time to wait for save to complete
  const saveWithTimeout = <T,>(promise: PromiseLike<T>, ms = 20000): Promise<T> => {
    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Save timed out. Please try again."));
      }, ms);
    });
    return Promise.race([promise as Promise<any>, timeout]).finally(() => {
      if (timeoutId) window.clearTimeout(timeoutId);
    }) as Promise<T>;
  };

  // Sanitize funnel payload to avoid non-serializable values and trim fields
  const sanitizeFunnel = (data: any) => {
    const prune = (val: any): any => {
      if (val === null) return null;
      if (typeof val === 'undefined') return null;
      if (typeof val === 'function') return undefined;
      if (val instanceof Date) return val.toISOString();
      if (Array.isArray(val)) return val.map(prune).filter((v) => v !== undefined);
      if (typeof val === 'object') {
        const out: any = {};
        for (const key of Object.keys(val)) {
          const v = prune((val as any)[key]);
          if (v !== undefined) out[key] = v;
        }
        return out;
      }
      return val;
    };
    
    try {
      const cleaned: any = prune(data) ?? {};
      
      // Ensure media array is properly structured for database storage
      if (Array.isArray(cleaned.media)) {
        cleaned.media = cleaned.media.map((m: any) => {
          const mediaItem = {
            url: String(m?.url ?? ''),
            type: (m?.type === 'video') ? 'video' : 'image',
            title: String(m?.title ?? ''),
            description: String(m?.description ?? '')
          };
          return mediaItem;
        }).filter(m => m.url); // Only keep items with valid URLs
      }
      
      // Test serialization
      JSON.stringify(cleaned);
      console.log('[ServiceFunnelEditor] Sanitized funnel data:', cleaned);
      return cleaned;
    } catch (error) {
      console.error('[ServiceFunnelEditor] Funnel sanitization error:', error);
      throw new Error('Failed to sanitize funnel data for saving');
    }
  };

  // Track local pricing changes separate from service object
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

  // Track current editing package ID for preview
  const [currentEditingPackageId, setCurrentEditingPackageId] = useState<string | null>(null);

  // Track selected default package ID
  const [selectedDefaultPackageId, setSelectedDefaultPackageId] = useState<string | null>(
    (service as any).default_package_id || null
  );

  // Update local pricing when service changes
  useEffect(() => {
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
  }, [service]);

  // Prepare save payload with current service and local pricing data
  const prepareSavePayload = useCallback(() => {
    const sanitizedFunnel = sanitizeFunnel(funnelData);
    const sanitizedPricing = JSON.parse(JSON.stringify(pricingTiers || []));
    
    // Normalize pricing fields to prevent NaN errors
    const normalizedRetailPrice = normalizePrice(localPricing.retail_price);
    const normalizedProPrice = normalizePrice(localPricing.pro_price);
    const normalizedCoPayPrice = normalizePrice(localPricing.co_pay_price);
    
    // Debug log the price transformations
    dlogPriceTransform('retail_price', localPricing.retail_price, normalizedRetailPrice);
    dlogPriceTransform('pro_price', localPricing.pro_price, normalizedProPrice);
    dlogPriceTransform('co_pay_price', localPricing.co_pay_price, normalizedCoPayPrice);
    
    // Convert pricing packages to proper format with normalized prices
    const updatedPackages = sanitizedPricing.map((p: any) => ({
      ...p,
      retail_price: normalizePrice(p.retail_price),
      pro_price: normalizePrice(p.pro_price),
      co_pay_price: normalizePrice(p.co_pay_price),
    }));
    
    return {
      // Service-level fields that can be edited in funnel
      title: service.title,
      description: service.description,
      website_url: service.website_url,
      duration: service.duration,
      setup_time: service.setup_time,
      image_url: service.image_url,
      logo_url: service.logo_url,
      price_duration: service.price_duration,
      // Funnel content
      funnel_content: sanitizedFunnel,
      pricing_tiers: updatedPackages,
      // Use normalized pricing values to prevent NaN database errors
      retail_price: normalizedRetailPrice,
      pro_price: normalizedProPrice,
      co_pay_price: normalizedCoPayPrice,
      default_package_id: selectedDefaultPackageId || null,
      pricing_mode: localPricing.pricing_mode,
      pricing_external_url: localPricing.pricing_external_url,
      pricing_cta_label: localPricing.pricing_cta_label,
      pricing_cta_type: localPricing.pricing_cta_type,
      pricing_note: localPricing.pricing_note,
      updated_at: new Date().toISOString()
    };
  }, [service, localPricing, funnelData, pricingTiers, selectedDefaultPackageId]);

  const handleSave = async () => {
    if (isSaving) return;
    
    try {
      console.log('[ServiceFunnelEditor] Starting save process...');
      
      const payload = prepareSavePayload();
      console.log('[ServiceFunnelEditor] Payload prepared:', Object.keys(payload));
      
      // Check if funnel_content exists and log its structure
      if (payload.funnel_content) {
        console.log('[ServiceFunnelEditor] Funnel content keys:', Object.keys(payload.funnel_content));
        if (payload.funnel_content.media) {
          console.log('[ServiceFunnelEditor] Media items count:', payload.funnel_content.media.length);
        }
      }
      
      // Validate funnel_content serialization
      if (payload.funnel_content) {
        try {
          const serialized = JSON.stringify(payload.funnel_content);
          console.log('[ServiceFunnelEditor] Funnel content serialized successfully, size:', serialized.length);
        } catch (e) {
          console.error('[ServiceFunnelEditor] Funnel content serialization failed:', e);
          throw new Error('Funnel content contains non-serializable data');
        }
      }
      
      console.log('[ServiceFunnelEditor] Calling saveImmediately...');
      
      // Use the hook's saveImmediately method which handles saving state internally
      await saveImmediately(service.id, payload);
      console.log('[ServiceFunnelEditor] Save completed successfully');
      
      setHasChanges(false);
      setLastSavedAt(new Date().toISOString());
      
      // Show explicit save confirmation
      toast({
        title: "Saved Successfully", 
        description: "All changes have been saved",
        duration: 2000
      });
      
      // Only run heavy operations on explicit save
      setTimeout(() => {
        (async () => {
          try {
            // Add cache busting to ensure fresh data
            const cacheBuster = Date.now();
            await fetch(
              `${window.location.origin}/functions/v1/warm-marketplace-cache?v=${cacheBuster}`,
              { 
                method: 'POST', 
                headers: { 
                  'cache-control': 'no-store',
                  'pragma': 'no-cache'
                } 
              }
            );
            console.log("[Admin ServiceFunnelEditor] Cache warmed with cache busting");
          } catch (e) {
            console.warn('[Admin ServiceFunnelEditor] Cache warm failed', e);
          }
          // Full invalidation after explicit save
          invalidateServices();
        })();
      }, 100);
    } catch (error: any) {
      console.error('[ServiceFunnelEditor] Save operation failed:', error);
      
      // Show explicit save error
      toast({
        title: "Save Failed",
        description: error.message || "Please try again",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleDataChange = (section: string, data: any) => {
    setFunnelData(prev => ({
      ...prev,
      [section]: data
    }));
    setHasChanges(true);
    
    // Trigger debounced auto-save
    const payload = prepareSavePayload();
    debouncedSave(service.id, payload, 'funnel-data-change');
  };

  const handlePricingChange = (tiers: any[]) => {
    setPricingTiers(tiers);
    setHasChanges(true);
    
    // Trigger debounced auto-save
    const payload = prepareSavePayload();
    debouncedSave(service.id, payload, 'pricing-tiers-change');
  };

  // Handle pricing field changes (retail_price, pro_price, etc.)
  const handlePricingFieldChange = (field: string, value: string | number | null) => {
    console.log(`[Admin ServiceFunnelEditor] Pricing field changed: ${field} = ${value}`);
    setLocalPricing(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Trigger debounced auto-save
    setTimeout(() => {
      const payload = prepareSavePayload();
      debouncedSave(service.id, payload, 'pricing-field-change');
    }, 100); // Small delay to ensure state is updated
  };

  const handleReset = () => {
    setFunnelData(service.funnel_content || {});
    setPricingTiers(service.pricing_tiers || []);
    setHasChanges(false);
    setLastSavedAt(null);
  };

  // Create preview service object with required fields
  const previewService = {
    ...service,
    funnel_content: funnelData,
    pricing_tiers: pricingTiers,
    default_package_id: selectedDefaultPackageId,
    category: service.category || 'general',
    is_featured: service.is_featured || false,
    is_top_pick: service.is_top_pick || false,
    vendor: service.vendor || { 
      name: 'Preview Vendor', 
      rating: 4.8, 
      review_count: 127, 
      is_verified: true, 
      logo_url: '' 
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Service Funnel Editor
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Customize the sales funnel for "{service.title}"
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Unsaved Changes
                </Badge>
              )}
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
                disabled={!hasChanges || isSaving}
                size="sm"
                variant={lastSavedAt && !hasChanges ? "outline" : "default"}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 
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
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Social Proof
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <FunnelSectionEditor
            data={{
              ...service,
              ...funnelData,
            }}
            onChange={(data) => {
              // Extract funnel-specific fields
              const { id, title, description, website_url, duration, setup_time, image_url, logo_url, ...funnelContent } = data;
              
              // Update funnel content
              setFunnelData(funnelContent);
              
              // Update service-level fields if they changed
              if (title !== service.title || description !== service.description || website_url !== service.website_url || 
                  duration !== service.duration || setup_time !== service.setup_time ||
                  image_url !== service.image_url || logo_url !== service.logo_url) {
                // Update the service directly via parent
                onUpdate({
                  ...service,
                  title: title || service.title,
                  description: description || service.description,
                  website_url: website_url || service.website_url,
                  duration: duration || service.duration,
                  setup_time: setup_time || service.setup_time,
                  image_url: image_url || service.image_url,
                  logo_url: logo_url || service.logo_url
                });
                
                // Trigger debounced save for service-level changes
                setTimeout(() => {
                  const payload = prepareSavePayload();
                  debouncedSave(service.id, payload, 'service-fields-change');
                }, 100);
              }
              
              // Update pricing tiers if changed (this shouldn't happen from content tab anymore)
              // All pricing is now handled in the dedicated pricing tab
              
              setHasChanges(true);
            }}
          />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <FunnelMediaEditor
            media={funnelData.media || []}
            serviceImageUrl={service.image_url}
            onChange={(media) => handleDataChange('media', media)}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <FunnelPricingEditor
            pricingTiers={pricingTiers}
            onChange={handlePricingChange}
            pricingMode={service.pricing_mode}
            pricingExternalUrl={service.pricing_external_url}
            pricingCtaLabel={service.pricing_cta_label}
            pricingCtaType={service.pricing_cta_type}
            pricingNote={service.pricing_note}
            service={{
              ...service,
              ...localPricing
            }}
            onPricingFieldChange={handlePricingFieldChange}
            onPricingModeChange={(mode) => {
              // Update service pricing mode immediately for UI responsiveness
              const updatedService = { ...service, pricing_mode: mode };
              onUpdate(updatedService);
              setHasChanges(true);
            }}
          />
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          <div className="space-y-4">
            {/* Proof Settings - Toggles for what displays in funnel */}
            <FunnelProofEditor
              proofData={funnelData.proofItWorks || {
                testimonials: { enabled: false, items: [] },
                caseStudy: { enabled: false, data: { beforeValue: 0, afterValue: 0, beforeLabel: "", afterLabel: "", percentageIncrease: 0, timeframe: "", description: "" } },
                vendorVerification: { enabled: false, data: { badges: [], description: "" } }
              }}
              onChange={(data) => handleDataChange('proofItWorks', data)}
            />
            
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <FunnelFAQEditor
            faqSections={funnelData.faqSections || []}
            onChange={(data) => handleDataChange('faqSections', data)}
          />
        </TabsContent>
      </Tabs>

      {/* Preview Modal - pass currentEditingPackageId for Package Two testing */}
      <ServiceFunnelModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        service={previewService}
        requestedId={currentEditingPackageId}
      />
    </div>
  );
};
