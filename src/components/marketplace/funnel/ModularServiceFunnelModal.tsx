import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect } from "react";
import { ServiceHeroSection } from "./ServiceHeroSection";
import { ServiceContentSection } from "./ServiceContentSection";
import { ServiceReviewsSection } from "./ServiceReviewsSection";
import { ServiceQASection } from "./ServiceQASection";
import { ServiceRelatedSection } from "./ServiceRelatedSection";
import { FunnelRenderer } from "../FunnelRenderer";
import { ConsultationFlow } from "../ConsultationFlow";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ModularServiceFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  vendor: any;
}

export const ModularServiceFunnelModal = ({
  isOpen,
  onClose,
  service,
  vendor
}: ModularServiceFunnelModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isConsultationFlowOpen, setIsConsultationFlowOpen] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Determine available packages
  const packages = service.pricing_tiers && service.pricing_tiers.length > 0 
    ? service.pricing_tiers 
    : [{
        name: "Standard Package",
        price: service.pro_price || service.retail_price || "Contact for pricing",
        description: "Professional service delivery",
        features: ["Complete service", "Professional support", "Quality guarantee"]
      }];

  // Set initial package if not already selected
  useEffect(() => {
    if (!selectedPackage && packages.length > 0) {
      setSelectedPackage(packages[0]);
    }
  }, [packages, selectedPackage]);

  const handleAddToCart = () => {
    if (!selectedPackage) return;

    addToCart({
      id: service.id,
      title: service.title,
      price: parseFloat(selectedPackage.price.replace(/[^0-9.]/g, '')),
      vendor: vendor?.business_name,
      image: service.image_url,
      type: 'service' as const
    });

    toast({
      title: "Added to cart",
      description: `${service.title} (${selectedPackage.name}) has been added to your cart.`,
    });
  };

  const handleScheduleConsultation = () => {
    setIsConsultationFlowOpen(true);
  };

  // Check if vendor has custom funnel enabled
  const hasCustomFunnel = vendor?.funnel_enabled && service.funnel_content?.custom_html;

  if (hasCustomFunnel) {
    // Render custom HTML funnel
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-6xl h-[90vh] p-0">
            <ScrollArea className="h-full">
              <FunnelRenderer
                funnelContent={service.funnel_content}
                serviceTitle={service.title}
                onClose={onClose}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <ConsultationFlow
          isOpen={isConsultationFlowOpen}
          onClose={() => setIsConsultationFlowOpen(false)}
          service={service}
        />
      </>
    );
  }

  // Render modular template-based funnel
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <ScrollArea className="h-full">
            <div className="space-y-0">
              {/* Hero Section */}
              <ServiceHeroSection
                service={service}
                vendor={vendor}
                selectedPackage={selectedPackage}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
                onScheduleConsultation={handleScheduleConsultation}
              />

              {/* Tabbed Content */}
              <div className="p-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Service Details</TabsTrigger>
                    <TabsTrigger value="reviews">Agent Reviews</TabsTrigger>
                    <TabsTrigger value="qa">Q&A</TabsTrigger>
                    <TabsTrigger value="related">More Services</TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <TabsContent value="details" className="space-y-6">
                      <ServiceContentSection service={service} />
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                      <ServiceReviewsSection service={service} />
                    </TabsContent>

                    <TabsContent value="qa" className="space-y-6">
                      <ServiceQASection service={service} vendor={vendor} />
                    </TabsContent>

                    <TabsContent value="related" className="space-y-6">
                      <ServiceRelatedSection vendor={vendor} currentServiceId={service.id} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConsultationFlow
        isOpen={isConsultationFlowOpen}
        onClose={() => setIsConsultationFlowOpen(false)}
        service={service}
      />
    </>
  );
};