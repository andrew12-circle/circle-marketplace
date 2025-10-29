import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, CreditCard, DollarSign, Coins, Loader2, UserPlus, Lock, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { VendorSelectionModal } from "./VendorSelectionModal";
import { Service } from "@/hooks/useMarketplaceData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateCopayPrice } from "@/utils/sharedPricing";

interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  onProChoice: (service: Service) => void;
  onCoPayChoice: (service: Service, vendor?: any) => void;
  onPointsChoice: (service: Service) => void;
}

export const PaymentChoiceModal = ({
  isOpen,
  onClose,
  service,
  onProChoice,
  onCoPayChoice,
  onPointsChoice
}: PaymentChoiceModalProps) => {
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [agentPoints, setAgentPoints] = useState<number>(0);
  const [respaCompliance, setRespaCompliance] = useState<boolean>(false);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const { updateCartItemCoverage } = useCart();
  const { user, profile } = useAuth();

  // Check if user is pro member
  const isProMember = profile?.is_pro_member || false;

  const handleRetailChoice = () => {
    if (!user) {
      return;
    }
    // Update cart item with retail coverage
    updateCartItemCoverage(service.id, 'retail');
    onProChoice(service); // Use same handler but with retail price
    onClose();
  };

  const handleProChoice = () => {
    if (!user || !isProMember) {
      // Show upgrade prompt for non-pro users
      return;
    }
    // Update cart item with pro coverage
    updateCartItemCoverage(service.id, 'pro');
    onProChoice(service);
    onClose();
  };

  const handleCoPayChoice = () => {
    if (!user || !isProMember) {
      // Show upgrade prompt for non-pro users
      return;
    }
    setIsVendorModalOpen(true);
  };

  const handleVendorSelected = (vendor: any) => {
    // Update cart item with copay coverage and selected vendor
    updateCartItemCoverage(service.id, 'copay', vendor);
    setIsVendorModalOpen(false);
    onCoPayChoice(service, vendor);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      loadAgentPointsData();
    }
  }, [isOpen]);

  const loadAgentPointsData = async () => {
    setLoadingPoints(true);
    try {
      // Mock data for now - replace with actual RPC calls when available
      setAgentPoints(1500);
      setRespaCompliance(true);
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const getPointsUsageBreakdown = () => {
    const retailPrice = typeof service.retail_price === 'number' ? service.retail_price : 0;
    const proPrice = typeof service.pro_price === 'number' ? service.pro_price : retailPrice;
    
    if (respaCompliance) {
      return {
        canUsePoints: agentPoints >= proPrice,
        pointsNeeded: proPrice,
        respaNote: "RESPA compliant - can use full points"
      };
    } else {
      const respaLimit = service.respa_split_limit || 50;
      const maxPointsAllowed = Math.floor((proPrice * respaLimit) / 100);
      return {
        canUsePoints: agentPoints >= maxPointsAllowed,
        pointsNeeded: maxPointsAllowed,
        respaNote: `Non-SSP: max ${respaLimit}% points allowed`
      };
    }
  };

  const handlePointsChoice = () => {
    if (!isProMember) {
      return;
    }
    updateCartItemCoverage(service.id, 'pro'); // Use 'pro' as the coverage type for points
    onPointsChoice(service);
    onClose();
  };

  const retailPrice = service.retail_price || service.pro_price;
  const proPrice = service.pro_price || service.retail_price;
  const coPayPrice = calculateCopayPrice(service);
  const coPaySplit = service.respa_split_limit || 50;
  const pointsBreakdown = getPointsUsageBreakdown();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Choose how to cover "{service.title}"
            </DialogTitle>
            <DialogDescription>
              Select your preferred payment method for this service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Retail Price Option - Hidden for pro members when pro price exists */}
            {(!isProMember || !service.pro_price) && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold">Pay Retail Price</h3>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mb-2">{retailPrice}/mo</div>
                  <p className="text-sm text-muted-foreground mb-4">Standard retail pricing available to everyone.</p>
                  <Button 
                    onClick={handleRetailChoice} 
                    variant="outline"
                    className="w-full"
                    disabled={!user}
                  >
                    {!user ? (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign In to Add to Cart
                      </>
                    ) : (
                      `Add to Cart - ${retailPrice}/mo`
                    )}
                  </Button>
                  {!user && (
                    <div className="mt-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        Please{" "}
                        <a 
                          href="/auth" 
                          className="text-primary hover:underline font-medium"
                        >
                          sign in or create an account
                        </a>{" "}
                        to add items to your cart
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Circle Pro Price Option - Locked for Non-Pro */}
            <Card className={!isProMember ? "opacity-75 border-dashed" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Pay Circle Pro Price</h3>
                  </div>
                  {isProMember ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Crown className="w-3 h-3 mr-1" />
                      Pro Member
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-300 text-orange-600">
                      <Lock className="w-3 h-3 mr-1" />
                      Pro Only
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-primary mb-2">${proPrice}/mo</div>
                <p className="text-sm text-muted-foreground mb-4">
                  {isProMember 
                    ? "Pay your discounted member price and get started immediately."
                    : "Exclusive discounted pricing for Circle Pro members."
                  }
                </p>
                <Button 
                  onClick={handleProChoice} 
                  className="w-full"
                  disabled={!user || !isProMember}
                >
                  {!user ? (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign In to Add to Cart
                    </>
                  ) : !isProMember ? (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro to Access
                    </>
                  ) : (
                    "Add to Cart"
                  )}
                </Button>
                {!user && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      Please{" "}
                      <a 
                        href="/auth" 
                        className="text-primary hover:underline font-medium"
                      >
                        sign in or create an account
                      </a>{" "}
                      to add items to your cart
                    </p>
                  </div>
                )}
                {user && !isProMember && (
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

            {/* Co-Pay Option - Pro Only - Only show if copay is allowed for this service */}
            {service.copay_allowed !== false && (coPayPrice || !isProMember) && (
              <Card className={!isProMember ? "opacity-75 border-dashed" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold">Get Vendor Help (Co-Pay)</h3>
                    </div>
                    {isProMember ? (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <Crown className="w-3 h-3 mr-1" />
                        Pro Member
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-300 text-orange-600">
                        <Lock className="w-3 h-3 mr-1" />
                        Pro Only
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {isProMember ? `$${Math.round(coPayPrice)}` : "$0-50"}/mo
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">SSP</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isProMember 
                      ? "Get connected with a vendor partner. SSP vendors limited to 20% by RESPA compliance."
                      : "Connect with vetted vendor partners who can help with service costs."
                    }
                  </p>
                  {isProMember && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                      <div className="flex items-center gap-2 text-orange-600 text-sm">
                        <span className="text-orange-500">⚠</span>
                        Final pricing depends on vendor approval and compliance requirements.
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={handleCoPayChoice} 
                    variant="outline" 
                    className="w-full"
                    disabled={!user || !isProMember}
                  >
                    {!user ? (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign In to Find Vendor Partner
                      </>
                    ) : !isProMember ? (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro for Vendor Network
                      </>
                    ) : (
                      "Find Vendor Partner"
                    )}
                  </Button>
                  {!user && (
                    <div className="mt-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        Please{" "}
                        <a 
                          href="/auth" 
                          className="text-primary hover:underline font-medium"
                        >
                          sign in or create an account
                        </a>{" "}
                        to connect with vendor partners
                      </p>
                    </div>
                  )}
                  {user && !isProMember && (
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
            )}

            {/* Agent Points Option - Pro Only */}
            {loadingPoints ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-center">
                    <span>Loading your points...</span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {agentPoints > 0 && !loadingPoints && (
              <>
                <div className="text-center text-sm text-muted-foreground my-4">
                  OR get your bill reduced
                </div>
                <Card className={!isProMember ? "opacity-75 border-dashed" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold">Use Agent Points</h3>
                      </div>
                      {isProMember ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Crown className="w-3 h-3 mr-1" />
                          Pro Member
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 text-orange-600">
                          <Lock className="w-3 h-3 mr-1" />
                          Pro Only
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {isProMember ? `${pointsBreakdown.pointsNeeded} points` : "1000+ points"}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isProMember 
                        ? `${pointsBreakdown.respaNote} • ${agentPoints} available`
                        : "Use your accumulated points to reduce service costs"
                      }
                    </p>
                    <Button 
                      onClick={isProMember && pointsBreakdown.canUsePoints ? handlePointsChoice : undefined}
                      disabled={!isProMember || !pointsBreakdown.canUsePoints}
                      variant="outline"
                      className="w-full"
                    >
                      {!isProMember ? (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Pro to Use Points
                        </>
                      ) : (
                        "Use Points"
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
                          to access your points balance and rewards
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isVendorModalOpen && (
        <VendorSelectionModal
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
          onVendorSelect={handleVendorSelected}
          service={service}
        />
      )}
    </>
  );
};