import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Building, Users, TrendingUp, Award } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoanOfficerSelector } from "./LoanOfficerSelector";

interface Vendor {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  individual_name?: string;
  individual_title?: string;
  individual_phone?: string;
  individual_email?: string;
}

interface Service {
  id: string;
  title: string;
  co_pay_price?: string;
  retail_price?: string;
  pro_price?: string;
  image_url?: string;
  respa_split_limit?: number;
}

interface ConnectVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  service?: Service;
  onRequestSent: () => void;
}

export const ConnectVendorModal = ({ 
  isOpen, 
  onClose, 
  vendor, 
  service,
  onRequestSent 
}: ConnectVendorModalProps) => {
  const [coPayPercentage, setCoPayPercentage] = useState([service?.respa_split_limit || 50]);
  const [notes, setNotes] = useState("");
  const [selectedLoanOfficer, setSelectedLoanOfficer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to send co-pay requests.",
          variant: "destructive",
        });
        return;
      }

      // Create co-pay request
      const { data: coPayRequest, error } = await supabase
        .from('co_pay_requests')
        .insert({
          agent_id: user.id,
          vendor_id: vendor.id,
          service_id: service?.id,
          requested_split_percentage: coPayPercentage[0],
          status: 'pending',
          agent_notes: notes || `Partnership request for ${service?.title || 'services'}`
        })
        .select('id')
        .single();

      if (error) throw error;

      // Add to cart
      const cartItem = {
        id: coPayRequest.id,
        type: 'co-pay-request',
        vendor: vendor,
        service: service || {
          title: `Partnership with ${vendor.name}`,
          co_pay_price: "Contact for pricing"
        },
        status: 'pending-approval',
        requestedSplit: coPayPercentage[0],
        selectedLoanOfficer: selectedLoanOfficer,
        createdAt: new Date().toISOString()
      };

      const addToCartEvent = new CustomEvent('addCoPayToCart', { 
        detail: cartItem 
      });
      window.dispatchEvent(addToCartEvent);

      toast({
        title: "Request Sent!",
        description: `Co-pay request sent to ${vendor.name}. Check your cart for updates.`
      });

      onRequestSent();
      onClose();
    } catch (error) {
      console.error('Error creating co-pay request:', error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEstimatedSavings = () => {
    if (!service?.retail_price) return null;
    
    const price = parseFloat(service.retail_price.replace(/[^0-9.]/g, ''));
    if (isNaN(price)) return null;
    
    const savings = (price * coPayPercentage[0]) / 100;
    return savings.toFixed(0);
  };

  const estimatedSavings = calculateEstimatedSavings();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Co-Pay Partnership</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vendor Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {vendor.logo_url ? (
                  <img
                    src={vendor.logo_url}
                    alt={vendor.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{vendor.name}</h3>
                    {vendor.is_verified && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {vendor.rating.toFixed(1)} ({vendor.review_count} reviews)
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {vendor.co_marketing_agents} agents
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {vendor.campaigns_funded} campaigns
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Info */}
          {service && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Service Details</h4>
                <div className="flex items-center space-x-4">
                  {service.image_url && (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{service.title}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      {service.retail_price && <span>Retail: {service.retail_price}</span>}
                      {service.co_pay_price && <span>Co-pay: {service.co_pay_price}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Officer Selection */}
          <div>
            <Label className="text-base font-medium">Select Loan Officer (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choose a specific loan officer to work with
            </p>
            <LoanOfficerSelector
              vendor={vendor}
              onSelect={setSelectedLoanOfficer}
              selected={selectedLoanOfficer}
            />
          </div>

          {/* Co-Pay Percentage */}
          <div>
            <Label className="text-base font-medium">Requested Co-Pay Percentage</Label>
            <p className="text-sm text-muted-foreground mb-3">
              How much should the vendor contribute?
            </p>
            <div className="space-y-4">
              <Slider
                value={coPayPercentage}
                onValueChange={setCoPayPercentage}
                max={service?.respa_split_limit || 80}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>10%</span>
                <span className="font-medium text-primary">{coPayPercentage[0]}%</span>
                <span>{service?.respa_split_limit || 80}%</span>
              </div>
              {estimatedSavings && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Estimated savings: ${estimatedSavings}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-base font-medium">Additional Notes</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Add any specific requirements or details about your partnership request
            </p>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell the vendor about your needs, timeline, or specific requirements..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Co-Pay Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};