import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, CreditCard, DollarSign, Coins, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { VendorSelectionModal } from "./VendorSelectionModal";
import { Service } from "@/hooks/useMarketplaceData";
import { supabase } from "@/integrations/supabase/client";

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

  const handleProChoice = () => {
    // Update cart item with pro coverage
    updateCartItemCoverage(service.id, 'pro');
    onProChoice(service);
    onClose();
  };

  const handleCoPayChoice = () => {
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
    updateCartItemCoverage(service.id, 'pro'); // Use 'pro' as the coverage type for points
    onPointsChoice(service);
    onClose();
  };

  const proPrice = service.pro_price || service.retail_price;
  const coPayPrice = service.co_pay_price;
  const coPaySplit = service.respa_split_limit || 50;
  const pointsBreakdown = getPointsUsageBreakdown();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Choose how to cover "{service.title}"
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Circle Pro Price Option */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Pay Circle Pro Price</h3>
                </div>
                <div className="text-2xl font-bold text-primary mb-2">${proPrice}/mo</div>
                <p className="text-sm text-muted-foreground mb-4">Pay your discounted member price and get started immediately.</p>
                <Button onClick={handleProChoice} className="w-full">
                  Add to Cart - ${proPrice}/mo
                </Button>
              </CardContent>
            </Card>

            {/* Agent Points Option */}
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
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Coins className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">Use Agent Points</h3>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{pointsBreakdown.pointsNeeded} points</div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {pointsBreakdown.respaNote} • {agentPoints} available
                    </p>
                    <Button 
                      onClick={pointsBreakdown.canUsePoints ? handlePointsChoice : undefined}
                      disabled={!pointsBreakdown.canUsePoints}
                      variant="outline"
                      className="w-full"
                    >
                      Use Points
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Co-Pay Option */}
            {coPayPrice && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Get Vendor Help (Co-Pay)</h3>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">${coPayPrice}/mo</div>
                  <div className="text-sm text-muted-foreground mb-4">SSP</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get connected with a vendor partner. SSP vendors limited to 20% by RESPA compliance.
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <span className="text-orange-500">⚠</span>
                      Final pricing depends on vendor approval and compliance requirements.
                    </div>
                  </div>
                  <Button onClick={handleCoPayChoice} variant="outline" className="w-full">
                    Find Vendor Partner
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <VendorSelectionModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onVendorSelect={handleVendorSelected}
        service={service}
      />
    </>
  );
};