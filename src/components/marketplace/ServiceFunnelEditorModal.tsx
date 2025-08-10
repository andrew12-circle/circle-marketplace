import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save } from 'lucide-react';
import { ServiceFunnelEditor } from './ServiceFunnelEditor';
import { ServicePricingTiersEditor } from './ServicePricingTiersEditor';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ThumbnailItem {
  id: string;
  label: string;
  icon: string;
  mediaUrl?: string;
  description?: string;
}

interface FunnelContent {
  headline: string;
  subheadline: string;
  heroDescription: string;
  estimatedRoi: number;
  duration: string;
  
  whyChooseUs: {
    title: string;
    benefits: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  
  media: {
    id: string;
    type: 'image' | 'video' | 'document';
    url: string;
    title: string;
    description?: string;
  }[];
  
  packages: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    features: string[];
    popular: boolean;
    proOnly?: boolean;
    savings?: string;
  }[];

  thumbnailGallery: {
    enabled: boolean;
    title: string;
    items: ThumbnailItem[];
  };

  roiCalculator: {
    enabled: boolean;
    title: string;
    currentMonthlyClosings: number;
    averageCommission: number;
    increasePercentage: number;
    calculatedAdditionalIncome: number;
    calculatedAnnualIncrease: number;
  };

  testimonialCards: {
    enabled: boolean;
    title: string;
    cards: {
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
      timeAgo: string;
      borderColor: string;
      iconColor: string;
      icon: string;
    }[];
  };

  urgencySection: {
    enabled: boolean;
    title: string;
    message: string;
    spotsRemaining: number;
    totalSpots: number;
  };
  
  socialProof: {
    testimonials: {
      id: string;
      name: string;
      role: string;
      content: string;
      rating: number;
    }[];
    stats: {
      label: string;
      value: string;
    }[];
  };

  trustIndicators: {
    guarantee: string;
    cancellation: string;
    certification: string;
  };

  callToAction: {
    primaryHeadline: string;
    primaryDescription: string;
    primaryButtonText: string;
    secondaryHeadline: string;
    secondaryDescription: string;
    contactInfo: {
      phone: string;
      email: string;
      website: string;
    };
  };

  urgency: {
    enabled: boolean;
    message: string;
  };
}

interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
  isHtml?: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  duration: string; // 'mo', 'yr', 'one-time'
  features: PricingFeature[];
  isPopular: boolean;
  buttonText: string;
  badge?: string;
  position: number;
}

interface ServiceFunnelEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelContent: FunnelContent;
  onChange: (content: FunnelContent) => void;
  onSave: () => Promise<void>;
  serviceName: string;
  pricingTiers?: PricingTier[];
  onPricingTiersChange?: (tiers: PricingTier[]) => void;
}

export const ServiceFunnelEditorModal = ({ 
  open, 
  onOpenChange, 
  funnelContent, 
  onChange, 
  onSave,
  serviceName,
  pricingTiers = [],
  onPricingTiersChange
}: ServiceFunnelEditorModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Timeout helper
  const saveWithTimeout = (promise: Promise<void>, ms = 12000) => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        const id = window.setTimeout(() => {
          reject(new Error('Save timed out. Please try again.'));
        }, ms);
        // Clear timeout if the main promise settles
        promise.finally(() => window.clearTimeout(id));
      })
    ]);
  };

  const handleSave = async () => {
    console.log('[FunnelEditorModal] Save started');
    setIsSaving(true);
    try {
      await saveWithTimeout(onSave(), 12000);
      console.log('[FunnelEditorModal] Save completed successfully');
      toast({
        title: "Changes Saved",
        description: "Your funnel changes have been saved successfully.",
      });
    } catch (error: any) {
      console.error('[FunnelEditorModal] Save error:', error);
      toast({
        title: "Save Failed",
        description: error?.message || "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      console.log('[FunnelEditorModal] Save finished (spinner cleared)');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div>
              <h2 className="text-2xl font-bold">Edit Service Funnel</h2>
              <p className="text-muted-foreground">Editing: {serviceName}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSave} 
                className="flex items-center gap-2"
                disabled={isSaving}
                aria-busy={isSaving}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            <Tabs defaultValue="funnel" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="funnel">Funnel Design</TabsTrigger>
                <TabsTrigger value="pricing">Pricing Tiers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="funnel" className="h-full mt-4">
                <ServiceFunnelEditor
                  funnelContent={funnelContent}
                  onChange={onChange}
                />
              </TabsContent>
              
              <TabsContent value="pricing" className="h-full mt-4">
                <ServicePricingTiersEditor
                  tiers={pricingTiers}
                  onChange={onPricingTiersChange || (() => {})}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
