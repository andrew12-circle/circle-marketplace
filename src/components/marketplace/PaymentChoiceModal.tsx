import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, CreditCard, DollarSign } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { VendorSelectionModal } from "./VendorSelectionModal";
import { Service } from "@/hooks/useMarketplaceData";

interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  onProChoice: (service: Service) => void;
  onCoPayChoice: (service: Service, vendor?: any) => void;
}

export const PaymentChoiceModal = ({
  isOpen,
  onClose,
  service,
  onProChoice,
  onCoPayChoice
}: PaymentChoiceModalProps) => {
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
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

  const proPrice = service.pro_price || service.retail_price;
  const coPayPrice = service.co_pay_price;
  const coPaySplit = service.respa_split_limit || 50;

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