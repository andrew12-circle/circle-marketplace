import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, ShoppingCart, Coins, AlertTriangle, Info, Lock, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { computePotentialCoPayNonSSP } from "@/utils/dealPricing";
import { getProStatus } from "@/lib/profile";

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
    max_split_percentage_non_ssp?: number;
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
  const { user, profile } = useAuth();
  const [agentPoints, setAgentPoints] = useState<any>(null);
  const [respaCompliance, setRespaCompliance] = useState<any>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);

  // Check if user is pro member
  const isProMember = getProStatus(profile);

  const proPrice = service.pro_price ? parseFloat(service.pro_price.replace(/[^\d.]/g, '')) : 0;
  const retailPrice = service.retail_price ? parseFloat(service.retail_price.replace(/[^\d.]/g, '')) : proPrice;
  const coPayPrice = proPrice && service.respa_split_limit 
    ? proPrice * (1 - (service.respa_split_limit / 100))
    : 0;
  
  // Calculate Non-SSP potential pricing
  const nonSspCoPayPrice = service.max_split_percentage_non_ssp 
    ? computePotentialCoPayNonSSP(service.pro_price || service.retail_price || '0', service)
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
        className="max-w-md z-[100] max-h-[90vh] overflow-y-auto"
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

          {/* Retail Price Option - Always Available */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-600" />
                Pay Retail Price
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-600">
                  {retailPrice.toFixed(2)}{service.price_duration ? `/${service.price_duration}` : ''}
                </span>
                <span className="text-sm text-muted-foreground">
                  {service.requires_quote ? "Book Consultation" : "Standard Price"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Standard retail pricing available to everyone.
              </p>
              <Button 
                className="w-full" 
                onClick={onChooseProPrice}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart - {retailPrice.toFixed(2)}{service.price_duration ? `/${service.price_duration}` : ''}
              </Button>
            </CardContent>
          </Card>

          {/* Circle Pro Price Option - Locked for Non-Pro */}
          <Card className={`border-2 ${isProMember ? 'border-circle-primary/20' : 'opacity-75 border-dashed border-orange-300'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-5 h-5 text-circle-primary" />
                Pay Circle Pro Price
                {isProMember ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary ml-auto">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro Member
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-orange-300 text-orange-600 ml-auto">
                    <Lock className="w-3 h-3 mr-1" />
                    Pro Only
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${isProMember ? 'text-circle-primary' : 'text-gray-500'}`}>
                  {proPrice.toFixed(2)}{service.price_duration ? `/${service.price_duration}` : ''}
                </span>
                <span className="text-sm text-muted-foreground">
                  {service.requires_quote ? "Book Consultation" : "Member Price"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isProMember 
                  ? "Pay your discounted member price and get started immediately."
                  : "Exclusive discounted pricing for Circle Pro members."
                }
              </p>
              <Button 
                className="w-full" 
                onClick={isProMember ? onChooseProPrice : undefined}
                disabled={!isProMember}
              >
                {isProMember ? (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart - {proPrice.toFixed(2)}{service.price_duration ? `/${service.price_duration}` : ''}
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro to Access
                  </>
                )}
              </Button>
              {!isProMember && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    <a 
                      href="/pricing" 
                      className="text-primary hover:underline font-medium"
                    >
                      Upgrade to Circle Pro
                    </a>{" "}
                    to access member pricing and exclusive benefits
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Points Option */}
          {loadingPoints ? (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">Loading your points...</p>
              </CardContent>
            </Card>
          ) : agentPoints && canAffordWithPoints && isProMember ? (
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
                          <span className="font-medium">{pointsBreakdown.agentPays.toFixed(2)}</span>
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
                  {pointsBreakdown.agentPays > 0 && ` + ${pointsBreakdown.agentPays.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          ) : (agentPoints || !isProMember) ? (
            <Card className={`border-2 ${isProMember ? 'border-gray-200 opacity-60' : 'opacity-75 border-dashed border-orange-300'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-gray-500" />
                  Pay with Agent Points
                  {!isProMember && (
                    <Badge variant="outline" className="border-orange-300 text-orange-600 ml-auto">
                      <Lock className="w-3 h-3 mr-1" />
                      Pro Only
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-500">
                    {isProMember ? Math.ceil(proPrice) : "1000+"} Points
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {isProMember ? "Insufficient Balance" : "Pro Feature"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isProMember ? (
                    <>
                      You need {Math.ceil(proPrice)} points but only have {agentPoints?.total_available_points || 0} available.
                      {respaCompliance && !respaCompliance.can_cover_full_amount && (
                        <span className="block mt-1 text-amber-600">
                          RESPA compliance limits may apply to some of your points.
                        </span>
                      )}
                    </>
                  ) : (
                    "Use your accumulated points to reduce service costs"
                  )}
                </p>
                <Button disabled className="w-full">
                  <Coins className="w-4 h-4 mr-2" />
                  {isProMember ? "Insufficient Points" : "Upgrade to Pro for Points"}
                </Button>
                {!isProMember && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      <a 
                        href="/pricing" 
                        className="text-primary hover:underline font-medium"
                      >
                        Upgrade to Circle Pro
                      </a>{" "}
                      to access your points balance and rewards
                    </p>
                  </div>
                )}
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
          <Card className={`border-2 ${isProMember ? 'border-green-200' : 'opacity-75 border-dashed border-orange-300'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Get Vendor Help (Co-Pay)
                {!isProMember && (
                  <Badge variant="outline" className="border-orange-300 text-orange-600 ml-auto">
                    <Lock className="w-3 h-3 mr-1" />
                    Pro Only
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Standard SSP Pricing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${isProMember ? 'text-green-600' : 'text-gray-500'}`}>
                    {isProMember ? coPayPrice.toFixed(2) : "0-50"}{service.price_duration ? `/${service.price_duration}` : ''}
                  </span>
                  <Badge variant="secondary" className="text-xs">SSP</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Standard Rate
                </span>
              </div>
              
              {/* Non-SSP Potential Pricing */}
              {isProMember && nonSspCoPayPrice > 0 && nonSspCoPayPrice < coPayPrice && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-700">
                        As low as ~{nonSspCoPayPrice.toFixed(2)}
                      </span>
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-700">Non-SSP</Badge>
                    </div>
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-600">
                    Potential price with Non-SSP vendors (subject to approval)
                  </p>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                {isProMember 
                  ? `Get connected with a vendor partner. SSP vendors limited to ${service.respa_split_limit}% by RESPA compliance.`
                  : "Connect with vetted vendor partners who can help with service costs."
                }
              </p>
              
              {isProMember && (
                <div className="bg-amber-50 border border-amber-200 p-2 rounded text-xs text-amber-700">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Final pricing depends on vendor approval and compliance requirements.
                </div>
              )}
              
              <Button 
                className={`w-full ${isProMember ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} 
                onClick={isProMember ? onChooseCoPay : undefined}
                disabled={!isProMember}
                variant={isProMember ? "default" : "outline"}
              >
                <Users className="w-4 h-4 mr-2" />
                {isProMember ? "Find Vendor Partner" : "Upgrade to Pro for Vendor Network"}
              </Button>
              {!isProMember && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    <a 
                      href="/pricing" 
                      className="text-primary hover:underline font-medium"
                    >
                      Upgrade to Circle Pro
                    </a>{" "}
                    to access our exclusive vendor network
                  </p>
                </div>
              )}
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