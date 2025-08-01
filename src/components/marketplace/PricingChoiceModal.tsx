import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Users, ShoppingCart } from "lucide-react";

interface PricingChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    pro_price?: string;
    retail_price?: string;
    max_vendor_split_percentage?: number;
    price_duration?: string;
    requires_quote?: boolean;
  };
  onChooseProPrice: () => void;
  onChooseCoPay: () => void;
}

export const PricingChoiceModal = ({ 
  isOpen, 
  onClose, 
  service, 
  onChooseProPrice, 
  onChooseCoPay 
}: PricingChoiceModalProps) => {
  const proPrice = service.pro_price ? parseFloat(service.pro_price.replace(/[^\d.]/g, '')) : 0;
  const retailPrice = service.retail_price ? parseFloat(service.retail_price.replace(/[^\d.]/g, '')) : 0;
  const coPayPrice = retailPrice && service.max_vendor_split_percentage 
    ? retailPrice * (1 - (service.max_vendor_split_percentage / 100))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md z-[100]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Choose Your Payment Option</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            How would you like to purchase "{service.title}"?
          </p>

          {/* Circle Pro Price Option */}
          <Card className="border-2 border-circle-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-5 h-5 text-circle-primary" />
                Pay Circle Pro Price
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-circle-primary">
                  ${proPrice.toFixed(2)}{service.price_duration ? `/${service.price_duration}` : ''}
                </span>
                <span className="text-sm text-muted-foreground">
                  {service.requires_quote ? "Book Consultation" : "Instant Purchase"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pay your discounted member price and get started immediately.
              </p>
                <Button 
                className="w-full" 
                onClick={onChooseProPrice}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart - ${proPrice.toFixed(2)}{service.price_duration ? `/${service.price_duration}` : ''}
              </Button>
            </CardContent>
          </Card>

          {/* Co-Pay Option */}
          <Card className="border-2 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Get Vendor Help (Co-Pay)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">
                  ${coPayPrice.toFixed(2)}{service.price_duration ? `/${service.price_duration}` : ''}
                </span>
                <span className="text-sm text-muted-foreground">
                  Vendor Assisted
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Get connected with a vendor who will help cover {service.max_vendor_split_percentage}% of the cost.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-green-200 text-green-700 hover:bg-green-50" 
                onClick={onChooseCoPay}
              >
                <Users className="w-4 h-4 mr-2" />
                Find Vendor Partner
              </Button>
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};