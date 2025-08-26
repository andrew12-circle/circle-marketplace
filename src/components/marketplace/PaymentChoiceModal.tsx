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

          <div className="grid gap-4 mt-4">
            {/* Circle Pro Price Option */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleProChoice}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Circle Pro Price</h3>
                      <p className="text-sm text-muted-foreground">Pay directly and complete purchase</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${proPrice}</div>
                    <Badge variant="secondary">Self-Pay</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Points Option */}
            {loadingPoints ? (
              <Card className="opacity-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Loading agent points...</span>
                  </div>
                </CardContent>
              </Card>
            ) : agentPoints > 0 ? (
              <Card 
                className={`cursor-pointer hover:shadow-md transition-shadow ${!pointsBreakdown.canUsePoints ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={pointsBreakdown.canUsePoints ? handlePointsChoice : undefined}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Coins className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Pay with Agent Points</h3>
                        <p className="text-sm text-muted-foreground">
                          Use your earned points • {pointsBreakdown.respaNote}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{pointsBreakdown.pointsNeeded} pts</div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-blue-50">
                          <Coins className="w-3 h-3 mr-1" />
                          {agentPoints} available
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Co-Pay Option */}
            {coPayPrice && (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCoPayChoice}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Co-Pay Price</h3>
                        <p className="text-sm text-muted-foreground">
                          Invite a vendor to help cover {coPaySplit}% of the cost
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${coPayPrice}</div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="bg-green-50">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Vendor Help
                        </Badge>
                      </div>
                    </div>
                  </div>
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