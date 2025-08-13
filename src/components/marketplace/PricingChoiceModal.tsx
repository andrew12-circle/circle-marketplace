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
    id: string;
    title: string;
    pro_price?: string;
    retail_price?: string;
    respa_split_limit?: number;
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
  const [respaCompliance, setRespaCompliance] = useState<any>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);

  const proPrice = service.pro_price ? parseFloat(service.pro_price.replace(/[^\d.]/g, '')) : 0;
  const retailPrice = service.retail_price ? parseFloat(service.retail_price.replace(/[^\d.]/g, '')) : 0;
  const coPayPrice = proPrice && service.respa_split_limit 
    ? proPrice * (1 - (service.respa_split_limit / 100))
    : 0;

  // Load agent points and RESPA compliance when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadAgentPointsData();
    }
  }, [isOpen, user?.id]);

  const loadAgentPointsData = async () => {
    if (!user?.id) return;
    
    setLoadingPoints(true);
    try {
      // Get agent points summary
      const { data: pointsData, error: pointsError } = await supabase.rpc('get_agent_points_summary', {
        p_agent_id: user.id
      });

      if (pointsError) {
        console.error('Points loading error:', pointsError);
        throw pointsError;
      }
      if (pointsError) throw pointsError;
      setAgentPoints(pointsData);

      // Calculate RESPA compliance for this service
      const { data: complianceData, error: complianceError } = await supabase.rpc('calculate_respa_compliant_usage', {
        p_service_id: service.id,
        p_agent_id: user.id,
        p_total_amount: proPrice
      });

      if (complianceError) {
        console.warn('RESPA compliance calculation failed:', complianceError);
      } else {
        setRespaCompliance(complianceData);
      }
    } catch (error) {
      console.error('Error loading agent points:', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const canAffordWithPoints = agentPoints && proPrice > 0 && (
    respaCompliance?.can_cover_full_amount || 
    agentPoints.total_available_points >= proPrice
  );

  const getPointsUsageBreakdown = () => {
    if (!respaCompliance || !respaCompliance.coverage_breakdown) {
      return {
        totalPointsUsed: Math.ceil(proPrice),
        respaPoints: 0,
        nonRespaPoints: Math.ceil(proPrice),
        agentPays: 0
      };
    }

    const breakdown = respaCompliance.coverage_breakdown;
    return {
      totalPointsUsed: Math.ceil(breakdown.respa_portion + breakdown.non_respa_portion),
      respaPoints: Math.ceil(breakdown.respa_portion),
      nonRespaPoints: Math.ceil(breakdown.non_respa_portion), 
      agentPays: breakdown.agent_pays
    };
  };

  const pointsBreakdown = getPointsUsageBreakdown();

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
                    {pointsBreakdown.totalPointsUsed} Points
                  </span>
                  <span className="text-sm text-muted-foreground">
                    RESPA Compliant
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Use your co-pay points. You have {agentPoints.total_available_points} points available.
                  </p>
                  {respaCompliance && (
                    <div className="text-xs space-y-1 p-2 bg-blue-50 rounded">
                      {pointsBreakdown.respaPoints > 0 && (
                        <div className="flex justify-between">
                          <span>RESPA points:</span>
                          <span className="font-medium">{pointsBreakdown.respaPoints}</span>
                        </div>
                      )}
                      {pointsBreakdown.nonRespaPoints > 0 && (
                        <div className="flex justify-between">
                          <span>Non-RESPA points:</span>
                          <span className="font-medium">{pointsBreakdown.nonRespaPoints}</span>
                        </div>
                      )}
                      {pointsBreakdown.agentPays > 0 && (
                        <div className="flex justify-between text-amber-600">
                          <span>You pay:</span>
                          <span className="font-medium">${pointsBreakdown.agentPays.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={onChooseAgentPoints}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Use {pointsBreakdown.totalPointsUsed} Points
                  {pointsBreakdown.agentPays > 0 && ` + $${pointsBreakdown.agentPays.toFixed(2)}`}
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
                  {respaCompliance && !respaCompliance.can_cover_full_amount && (
                    <span className="block mt-1 text-amber-600">
                      RESPA compliance limits may apply to some of your points.
                    </span>
                  )}
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
                Get connected with a vendor who will help cover {service.respa_split_limit}% of the cost.
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