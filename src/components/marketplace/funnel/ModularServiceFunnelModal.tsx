import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect } from "react";
import { RebuiltFunnelTop } from "./RebuiltFunnelTop";
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

  // Bridge CTAs from custom HTML via postMessage
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const type = (event.data && (event.data.type || event.data?.data?.type)) || event?.data?.type;
      if (type === 'funnel:add_to_cart') {
        handleAddToCart();
      } else if (type === 'funnel:open_consultation') {
        handleScheduleConsultation();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [selectedPackage, quantity]);

  // Check if vendor has custom funnel enabled
  const hasCustomFunnel = vendor?.funnel_enabled && service.funnel_content?.custom_html;

  if (hasCustomFunnel) {
    // Render custom funnel at top + keep system tabs below (hybrid)
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-6xl h-[90vh] p-0">
            <ScrollArea className="h-full">
              {/* Custom Funnel */}
              <div className="w-full">
                <FunnelRenderer
                  funnelContent={service.funnel_content}
                  serviceTitle={service.title}
                  onClose={onClose}
                  heightClass="h-[65vh] md:h-[70vh]"
                />
              </div>

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
              <RebuiltFunnelTop
                service={service}
                vendor={vendor}
                selectedPackage={selectedPackage}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
                onScheduleConsultation={handleScheduleConsultation}
                onClose={onClose}
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