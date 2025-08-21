import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FacilitatorCheckoutWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    title: string;
    pro_price?: string;
    retail_price?: string;
    vendor_id: string;
  };
  vendor: {
    id: string;
    name: string;
    accepts_split_payments?: boolean;
    requires_circle_payout?: boolean;
    facilitator_fee_percentage?: number;
  };
}

export const FacilitatorCheckoutWizard: React.FC<FacilitatorCheckoutWizardProps> = ({
  open,
  onOpenChange,
  service,
  vendor
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Form data
  const [acknowledgedPrimaryPayer, setAcknowledgedPrimaryPayer] = useState(false);
  const [partnerType, setPartnerType] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [estimatedContribution, setEstimatedContribution] = useState(0);

  // Calculate amounts
  const servicePrice = parseFloat(service.pro_price?.replace(/[^0-9.]/g, '') || service.retail_price?.replace(/[^0-9.]/g, '') || '0');
  const partnerContribution = estimatedContribution || 0;
  const agentAmount = servicePrice - partnerContribution;
  const facilitatorFee = vendor.requires_circle_payout ? (servicePrice * (vendor.facilitator_fee_percentage || 3.0)) / 100 : 0;
  const totalAgentPayment = agentAmount + facilitatorFee;

  const handleStartOrder = async () => {
    if (!acknowledgedPrimaryPayer) {
      toast({
        title: "Acknowledgment Required",
        description: "You must acknowledge that you are the primary payer to proceed.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('copay-facilitator-start', {
        body: {
          serviceId: service.id,
          vendorId: vendor.id,
          totalServiceAmount: servicePrice,
          partnerType: partnerType || undefined,
          partnerEmail: partnerEmail || undefined,
          estimatedPartnerContribution: partnerContribution
        }
      });

      if (error) throw error;

      if (data.success) {
        setOrderId(data.order.id);
        setStep(2);
        toast({
          title: "Order Created",
          description: `Order ${data.order.orderNumber} has been created successfully.`
        });
      } else {
        throw new Error(data.error || 'Failed to create order');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start facilitator checkout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgentCheckout = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('copay-agent-checkout', {
        body: {
          orderId,
          acknowledgedPrimaryPayer: true
        }
      });

      if (error) throw error;

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start agent checkout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvitePartner = async () => {
    if (!orderId || !partnerEmail || !partnerType || partnerContribution <= 0) {
      toast({
        title: "Missing Information",
        description: "Please provide partner email, type, and contribution amount.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('copay-partner-invitation', {
        body: {
          orderId,
          partnerEmail,
          partnerType,
          contributionAmount: partnerContribution
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Partner Invited",
          description: `Invitation sent to ${partnerEmail} for $${partnerContribution.toFixed(2)} contribution.`
        });
      } else {
        throw new Error(data.error || 'Failed to invite partner');
      }
    } catch (error: any) {
      toast({
        title: "Invitation Error",
        description: error.message || "Failed to invite partner",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setOrderId(null);
    setAcknowledgedPrimaryPayer(false);
    setPartnerType('');
    setPartnerEmail('');
    setEstimatedContribution(0);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetWizard();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Co-Marketing Payment Facilitator</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Circle Network serves as a payment facilitator only. 
                You are the primary payer. Any co-marketing arrangements with partners are examples only 
                and must be negotiated directly between you and your chosen partner.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Details</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Service:</strong> {service.title}</p>
                <p><strong>Vendor:</strong> {vendor.name}</p>
                <p><strong>Service Price:</strong> ${servicePrice.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Partner Contribution (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Example: Settlement service providers typically contribute 20-30% for co-marketing
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partnerType">Partner Type</Label>
                  <Input
                    id="partnerType"
                    placeholder="e.g., Lender, Title Company"
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="partnerEmail">Partner Email</Label>
                  <Input
                    id="partnerEmail"
                    type="email"
                    placeholder="partner@example.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contribution">Estimated Contribution Amount</Label>
                <Input
                  id="contribution"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  max={servicePrice}
                  step="0.01"
                  value={estimatedContribution || ''}
                  onChange={(e) => setEstimatedContribution(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Summary</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Service Price:</span>
                  <span>${servicePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Partner Contribution:</span>
                  <span>-${partnerContribution.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Amount:</span>
                  <span>${agentAmount.toFixed(2)}</span>
                </div>
                {facilitatorFee > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Facilitation Fee ({vendor.facilitator_fee_percentage}%):</span>
                    <span>${facilitatorFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total You Pay:</span>
                  <span>${totalAgentPayment.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Required Acknowledgment:</strong> By proceeding, you acknowledge that you are the primary payer 
                for this service. Any partner contributions are separate arrangements that you must coordinate directly.
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acknowledgePrimaryPayer"
                checked={acknowledgedPrimaryPayer}
                onCheckedChange={(checked) => setAcknowledgedPrimaryPayer(checked as boolean)}
              />
              <Label htmlFor="acknowledgePrimaryPayer" className="text-sm">
                I acknowledge that I am the primary payer for this service and understand that 
                Circle Network is facilitating payment only.
              </Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStartOrder} 
                disabled={!acknowledgedPrimaryPayer || loading}
              >
                {loading ? "Creating Order..." : "Start Order"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Order Created Successfully</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Service:</strong> {service.title}</p>
                <p><strong>Your Payment:</strong> ${totalAgentPayment.toFixed(2)}</p>
                {partnerContribution > 0 && (
                  <p><strong>Partner Contribution:</strong> ${partnerContribution.toFixed(2)}</p>
                )}
              </div>

              {partnerEmail && partnerContribution > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Partner Invitation</span>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleInvitePartner}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Sending Invitation..." : `Invite ${partnerEmail}`}
                  </Button>
                </div>
              )}

              <Button 
                onClick={handleAgentCheckout}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Preparing Checkout..." : "Proceed to Payment"}
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can proceed with payment now. Partner contributions (if any) can be collected separately.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};