import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Users, ShoppingCart, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  onChooseAgentPoints: () => void;
}

export const PricingChoiceModal = ({ 
  isOpen, 
  onClose, 
  service, 
  onChooseProPrice, 
  onChooseCoPay,
  onChooseAgentPoints
}: PricingChoiceModalProps) => {
  const { user } = useAuth();
  const [agentPoints, setAgentPoints] = useState<any>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);

  const proPrice = service.pro_price ? parseFloat(service.pro_price.replace(/[^\d.]/g, '')) : 0;
  const retailPrice = service.retail_price ? parseFloat(service.retail_price.replace(/[^\d.]/g, '')) : 0;
  const coPayPrice = retailPrice && service.max_vendor_split_percentage 
    ? retailPrice * (1 - (service.max_vendor_split_percentage / 100))
    : 0;

  // Load agent points when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadAgentPointsData();
    }
  }, [isOpen, user?.id]);

  const loadAgentPointsData = async () => {
    if (!user?.id) return;
    
    setLoadingPoints(true);
    try {
      const { data, error } = await supabase.rpc('get_agent_points_summary', {
        p_agent_id: user.id
      });

      if (error) throw error;
      setAgentPoints(data);
    } catch (error) {
      console.error('Error loading agent points:', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const canAffordWithPoints = agentPoints && proPrice > 0 && agentPoints.total_available_points >= proPrice;

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

          {/* Agent Points Option */}
          {loadingPoints ? (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">Loading your points...</p>
              </CardContent>
            </Card>
          ) : agentPoints && canAffordWithPoints ? (
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  Pay with Agent Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">
                    {Math.ceil(proPrice)} Points
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Instant Purchase
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use your co-pay points. You have {agentPoints.total_available_points} points available.
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={onChooseAgentPoints}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Use {Math.ceil(proPrice)} Points
                </Button>
              </CardContent>
            </Card>
          ) : agentPoints ? (
            <Card className="border-2 border-gray-200 opacity-60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-gray-500" />
                  Pay with Agent Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-500">
                    {Math.ceil(proPrice)} Points
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Insufficient Balance
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You need {Math.ceil(proPrice)} points but only have {agentPoints.total_available_points} available.
                </p>
                <Button disabled className="w-full">
                  <Coins className="w-4 h-4 mr-2" />
                  Insufficient Points
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* OR Divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 border-t border-muted-foreground/20"></div>
            <span className="px-4 text-sm font-medium text-muted-foreground bg-background">OR get your bill reduced</span>
            <div className="flex-1 border-t border-muted-foreground/20"></div>
          </div>

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
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
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