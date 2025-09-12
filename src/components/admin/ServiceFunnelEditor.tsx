
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
import { useResilientSave } from "@/hooks/useResilientSave";
import { useAutosave } from "@/hooks/useAutosave";
import { useDraft } from "@/hooks/useDraft";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { FunnelSectionEditor } from "./FunnelSectionEditor";
import { FunnelMediaEditor } from "./FunnelMediaEditor";
import { FunnelPricingEditor } from "./FunnelPricingEditor";

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
  
  const { save: resilientSave, isSaving } = useResilientSave({
    maxRetries: 3,
    retryDelay: 1500,
    timeout: 90000
  });

  // Draft management
  const { saveDraft, clearDraft, hasDraft } = useDraft({
    key: `service-funnel-${service.id}`,
    initialData: { funnelData, pricingTiers },
    enabled: true
  });
  
  // Navigation guard
  useNavigationGuard({
    hasUnsavedChanges: hasChanges || isSaving
  });
  
  // Autosave integration with "Saved" feedback
  const { triggerAutosave } = useAutosave({
    onSave: async (data) => {
      await resilientSave(data, performSave);
      saveDraft(data);
    },
    onSaved: () => {
      setLastSavedAt(new Date().toISOString());
      setHasChanges(false);
    },
    delay: 6000,
    enabled: hasChanges
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
    const cleaned: any = prune(data) ?? {};
    if (Array.isArray(cleaned.media)) {
      cleaned.media = cleaned.media.map((m: any) => ({
        url: m?.url ?? '',
        type: m?.type === 'video' ? 'video' : 'image',
        title: m?.title ?? '',
        description: m?.description ?? ''
      }));
    }
    return cleaned;
  };

  const performSave = useCallback(async (data: { funnelData: any; pricingTiers: any[] }) => {
    console.log("[Admin ServiceFunnelEditor] Resilient save started", {
      serviceId: service.id,
      pricingFields: {
        retail_price: service.retail_price,
        pro_price: service.pro_price,
        co_pay_price: service.co_pay_price
      }
    });
    
    const sanitizedFunnel = sanitizeFunnel(data.funnelData);
    const sanitizedPricing = JSON.parse(JSON.stringify(data.pricingTiers || []));
    
    console.log("[Admin ServiceFunnelEditor] Starting database update...");
    
    const { error } = await supabase
      .from('services')
      .update({
        funnel_content: sanitizedFunnel,
        pricing_tiers: sanitizedPricing,
        // Include all service pricing fields
        retail_price: service.retail_price,
        pro_price: service.pro_price,
        co_pay_price: service.co_pay_price,
        pricing_mode: service.pricing_mode,
        pricing_external_url: service.pricing_external_url,
        pricing_cta_label: service.pricing_cta_label,
        pricing_cta_type: service.pricing_cta_type,
        pricing_note: service.pricing_note,
        updated_at: new Date().toISOString()
      })
      .eq('id', service.id);

    if (error) {
      console.error("[Admin ServiceFunnelEditor] Database error:", error);
      throw error;
    }

    console.log("[Admin ServiceFunnelEditor] Database updated successfully");
    
    const updatedService = {
      ...service,
      funnel_content: data.funnelData,
      pricing_tiers: data.pricingTiers
    };

    onUpdate(updatedService);
    
    // Only do scoped invalidation during autosave - no heavy operations
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.serviceById(service.id) });
    
    return true;
  }, [service, onUpdate, invalidateServices]);

  const handleSave = async () => {
    if (isSaving) return;
    
    try {
      await resilientSave({ funnelData, pricingTiers }, performSave);
      setHasChanges(false);
      clearDraft(); // Clear localStorage draft on successful explicit save
      
      // Only run heavy operations on explicit save
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('warm-marketplace-cache');
          console.log("[Admin ServiceFunnelEditor] Cache warmed after explicit save");
        } catch (e) {
          console.warn('[Admin ServiceFunnelEditor] Cache warm failed', e);
        }
        // Full invalidation after explicit save
        invalidateServices();
      }, 100);
    } catch (error: any) {
      // Error handling is managed by useResilientSave
      console.error('[Admin ServiceFunnelEditor] Save operation failed:', error);
    }
  };

  const handleDataChange = (section: string, data: any) => {
    setFunnelData(prev => ({
      ...prev,
      [section]: data
    }));
    setHasChanges(true);
  };

  const handlePricingChange = (tiers: any[]) => {
    setPricingTiers(tiers);
    setHasChanges(true);
  };

  const handleReset = () => {
    setFunnelData(service.funnel_content || {});
    setPricingTiers(service.pricing_tiers || []);
    setHasChanges(false);
    clearDraft();
    setLastSavedAt(null);
  };

  // Create preview service object with required fields
  const previewService = {
    ...service,
    funnel_content: funnelData,
    pricing_tiers: pricingTiers,
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
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
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
            data={funnelData}
            onChange={(data) => {
              setFunnelData(data);
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
            onPricingModeChange={(mode) => {
              // Update service pricing mode immediately for UI responsiveness
              const updatedService = { ...service, pricing_mode: mode };
              onUpdate(updatedService);
              setHasChanges(true);
            }}
            onPricingFieldChange={(field, value) => {
              // Update service pricing fields immediately for UI responsiveness
              const updatedService = { ...service, [field]: value };
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

      {/* Preview Modal */}
      <ServiceFunnelModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        service={previewService}
      />
    </div>
  );
};
