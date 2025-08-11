import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FunnelSectionEditor } from "./FunnelSectionEditor";
import { FunnelMediaEditor } from "./FunnelMediaEditor";
import { FunnelPricingEditor } from "./FunnelPricingEditor";
import { FunnelTestimonialsEditor } from "./FunnelTestimonialsEditor";
import { FunnelFAQEditor } from "./FunnelFAQEditor";
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
  funnel_content?: any;
  pricing_tiers?: any[];
  category?: string;
  is_featured?: boolean;
  is_top_pick?: boolean;
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({
          funnel_content: funnelData,
          pricing_tiers: pricingTiers,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id);

      if (error) throw error;

      const updatedService = {
        ...service,
        funnel_content: funnelData,
        pricing_tiers: pricingTiers
      };

      onUpdate(updatedService);
      setHasChanges(false);
      
      toast({
        title: "Funnel Updated Successfully",
        description: "All changes have been saved to the service funnel.",
      });
    } catch (error) {
      console.error('Error saving funnel:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the funnel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
            onChange={(data) => handleDataChange('', data)}
          />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <FunnelMediaEditor
            media={funnelData.media || []}
            onChange={(media) => handleDataChange('media', media)}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <FunnelPricingEditor
            pricingTiers={pricingTiers}
            onChange={handlePricingChange}
          />
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          <FunnelTestimonialsEditor
            testimonials={funnelData.testimonials || []}
            stats={funnelData.stats || []}
            onChange={(type, data) => handleDataChange(type, data)}
          />
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <FunnelFAQEditor
            faqSections={funnelData.faqSections || []}
            callToAction={funnelData.callToAction || {}}
            onChange={(type, data) => handleDataChange(type, data)}
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