import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Check, Calendar, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSpiritualCoverage } from "@/contexts/SpiritualCoverageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { extractAndValidatePrice } from "@/utils/priceValidation";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  title: string;
  description: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  price_duration?: string;
  image_url?: string;
  co_pay_allowed?: boolean;
  max_vendor_split_percentage?: number;
  vendor_id?: string;
  vendor: {
    name: string;
    rating: number;
    review_count: number;
  } | null;
}

interface DirectPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  onPurchaseComplete?: () => void;
}

export const DirectPurchaseModal = ({
  isOpen,
  onClose,
  service,
  onPurchaseComplete
}: DirectPurchaseModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'retail' | 'pro' | 'copay'>('retail');
  const [agentPoints, setAgentPoints] = useState<any>(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { profile, user } = useAuth();
  const { applyGuard } = useSpiritualCoverage();
  const { formatPrice } = useCurrency();
  const isProMember = profile?.is_pro_member || false;

  const extractNumericPrice = (priceString: string): number => {
    const validation = extractAndValidatePrice(priceString, 'retail');
    if (!validation.isValid || validation.sanitizedPrice === null) {
      return 0;
    }
    return validation.sanitizedPrice;
  };

  const retailPrice = service.retail_price ? extractNumericPrice(service.retail_price) : 0;
  const proPrice = service.pro_price ? extractNumericPrice(service.pro_price) : 0;
  const coPayPrice = service.co_pay_allowed && service.max_vendor_split_percentage 
    ? retailPrice * (1 - (service.max_vendor_split_percentage / 100))
    : 0;

  // Load agent points when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadAgentPoints();
    }
  }, [isOpen, user?.id]);

  const loadAgentPoints = async () => {
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

  const getCoPayCoverage = () => {
    const vendorSplitAmount = retailPrice * ((service.max_vendor_split_percentage || 0) / 100);
    const availablePoints = agentPoints?.total_available_points || 0;
    
    if (availablePoints >= vendorSplitAmount) {
      return {
        type: 'full_coverage',
        userPointsUsed: vendorSplitAmount,
        vendorRequest: 0,
        message: `Use ${vendorSplitAmount} of your points ($${vendorSplitAmount})`
      };
    } else if (availablePoints > 0) {
      const vendorRequest = vendorSplitAmount - availablePoints;
      return {
        type: 'partial_coverage',
        userPointsUsed: availablePoints,
        vendorRequest: vendorRequest,
        message: `Use ${availablePoints} points + request $${vendorRequest.toFixed(2)} from vendor`
      };
    } else {
      return {
        type: 'vendor_only',
        userPointsUsed: 0,
        vendorRequest: vendorSplitAmount,
        message: `Request $${vendorSplitAmount.toFixed(2)} from vendor`
      };
    }
  };

  const getSelectedPrice = () => {
    switch (selectedOption) {
      case 'pro': return proPrice;
      case 'copay': return coPayPrice;
      default: return retailPrice;
    }
  };

  const handleDirectPurchase = async () => {
    setIsProcessing(true);
    
    // Apply spiritual covering before purchase
    await applyGuard('CHECKOUT', { 
      serviceId: service.id, 
      amount: getSelectedPrice(),
      option: selectedOption
    });
    
    try {
      const selectedPrice = getSelectedPrice();
      
      if (selectedPrice === 0) {
        throw new Error("Invalid price selected");
      }

      // For co-pay purchases, try automatic point deduction with real-time charging
      if (selectedOption === 'copay' && service.vendor_id && service.max_vendor_split_percentage) {
        try {
          const coverage = getCoPayCoverage();
          
          // If agent has points to use
          if (coverage.userPointsUsed > 0) {
            const { data: pointsResult, error: pointsError } = await supabase.rpc('process_automatic_copay', {
              p_agent_id: user?.id,
              p_service_id: service.id,
              p_vendor_id: service.vendor_id,
              p_total_amount: coverage.userPointsUsed,
              p_coverage_percentage: 100 // Use exact amount in points
            });

            const result = pointsResult as any;
            if (!pointsError && result?.success) {
              // Process real-time charge for the points used
              const { data: chargeResult, error: chargeError } = await supabase.rpc(
                'process_real_time_charge',
                {
                  p_allocation_id: result.allocation_id,
                  p_transaction_id: result.transaction_id,
                  p_vendor_id: service.vendor_id,
                  p_agent_id: user?.id,
                  p_points_used: result.points_used,
                  p_amount_to_charge: result.points_used
                }
              );

              const chargeResponse = chargeResult as any;
              if (chargeResponse?.success) {
                // Process the actual Stripe charge
                const { error: stripeError } = await supabase.functions.invoke('process-point-charge', {
                  body: {
                    charge_id: chargeResponse.charge_id,
                    stripe_customer_id: chargeResponse.stripe_customer_id,
                    stripe_payment_method_id: chargeResponse.stripe_payment_method_id,
                    amount_to_charge: chargeResponse.amount_to_charge,
                    points_charged: chargeResponse.points_charged,
                    vendor_id: service.vendor_id
                  }
                });

                if (!stripeError) {
                  // If full coverage, we're done
                  if (coverage.type === 'full_coverage') {
                    toast({
                      title: "Purchase Complete!",
                      description: `Successfully used ${result.points_used} points for full co-pay coverage.`,
                    });

                    onPurchaseComplete?.();
                    onClose();
                    return;
                  }
                  
                  // If partial coverage, still need to create vendor request for remaining amount
                  if (coverage.type === 'partial_coverage' && coverage.vendorRequest > 0) {
                    // Create co-pay request for remaining amount
                    const { error: requestError } = await supabase
                      .from('co_pay_requests')
                      .insert({
                        agent_id: user?.id,
                        vendor_id: service.vendor_id,
                        service_id: service.id,
                        requested_split_percentage: Math.round((coverage.vendorRequest / retailPrice) * 100),
                        agent_notes: `Partial coverage: Used ${result.points_used} points, requesting $${coverage.vendorRequest.toFixed(2)} additional support`
                      });

                    if (!requestError) {
                      toast({
                        title: "Co-Pay Processed!",
                        description: `Used ${result.points_used} points and requested $${coverage.vendorRequest.toFixed(2)} from vendor.`,
                      });

                      onPurchaseComplete?.();
                      onClose();
                      return;
                    }
                  }
                }
              }
            }
          }
          
          // Fallback to vendor-only request if no points or points processing failed
          if (coverage.type === 'vendor_only') {
            const { error: requestError } = await supabase
              .from('co_pay_requests')
              .insert({
                agent_id: user?.id,
                vendor_id: service.vendor_id,
                service_id: service.id,
                requested_split_percentage: service.max_vendor_split_percentage,
                agent_notes: 'Requesting full co-pay support from vendor'
              });

            if (!requestError) {
              toast({
                title: "Co-Pay Request Sent!",
                description: `Requested $${coverage.vendorRequest.toFixed(2)} co-pay support from vendor.`,
              });

              onPurchaseComplete?.();
              onClose();
              return;
            }
          }
        } catch (pointsErr) {
          console.error('Co-pay processing failed:', pointsErr);
        }
      }

      // Fallback to regular Stripe checkout
      const cartItem = {
        id: service.id,
        title: service.title,
        price: selectedPrice,
        vendor: service.vendor?.name || 'Unknown Vendor',
        image_url: service.image_url,
        requiresQuote: false,
        quantity: 1
      };

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create checkout directly
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          items: [cartItem]
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : {},
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to checkout",
          description: "Opening secure payment in new tab...",
        });

        onPurchaseComplete?.();
        onClose();
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Direct purchase error:', errorMessage);
      
      toast({
        title: "Purchase failed",
        description: "Unable to process purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCartAndCheckout = () => {
    const selectedPrice = getSelectedPrice();
    
    addToCart({
      id: service.id,
      title: service.title,
      price: selectedPrice,
      vendor: service.vendor?.name || 'Unknown Vendor',
      image_url: service.image_url,
      requiresQuote: false,
      type: 'service'
    });

    // Open cart for checkout
    window.dispatchEvent(new CustomEvent('openCart'));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Purchase {service.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {service.image_url && (
                  <img 
                    src={service.image_url} 
                    alt={service.title}
                    className="w-20 h-20 object-contain rounded-lg bg-gray-50"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  {service.vendor && (
                    <p className="text-sm text-muted-foreground mt-1">
                      by {service.vendor.name} ⭐ {service.vendor.rating} ({service.vendor.review_count} reviews)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Options */}
          <div className="space-y-4">
            <h4 className="font-semibold">Choose your pricing option:</h4>
            
            {/* Retail Price */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedOption === 'retail' ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedOption('retail')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedOption === 'retail' ? 'bg-primary border-primary' : 'border-gray-300'
                    }`}>
                      {selectedOption === 'retail' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h5 className="font-medium">Standard Price</h5>
                      <p className="text-sm text-muted-foreground">Full retail pricing</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {formatPrice(retailPrice, service.price_duration || 'mo')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Price */}
            {isProMember && proPrice > 0 && (
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedOption === 'pro' ? 'ring-2 ring-circle-primary' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedOption('pro')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedOption === 'pro' ? 'bg-circle-primary border-circle-primary' : 'border-gray-300'
                      }`}>
                        {selectedOption === 'pro' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-circle-primary">Circle Pro Price</h5>
                          <Crown className="w-4 h-4 text-circle-primary" />
                          <Badge className="bg-circle-primary text-white text-xs">Member Price</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Exclusive member discount</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-circle-primary">
                        {formatPrice(proPrice, service.price_duration || 'mo')}
                      </div>
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(retailPrice, service.price_duration || 'mo')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Co-Pay Option */}
            {isProMember && service.co_pay_allowed && coPayPrice > 0 && (
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedOption === 'copay' ? 'ring-2 ring-green-600' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedOption('copay')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedOption === 'copay' ? 'bg-green-600 border-green-600' : 'border-gray-300'
                      }`}>
                        {selectedOption === 'copay' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-green-600">Co-Pay Option</h5>
                          <Users className="w-4 h-4 text-green-600" />
                          <Badge className="bg-green-600 text-white text-xs">
                            {service.max_vendor_split_percentage}% vendor support
                          </Badge>
                        </div>
                        {loadingPoints ? (
                          <p className="text-sm text-muted-foreground">Loading your points...</p>
                        ) : agentPoints ? (
                          <p className="text-sm text-muted-foreground">
                            {getCoPayCoverage().message}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Vendor shares advertising cost</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(coPayPrice, service.price_duration || 'mo')}
                      </div>
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(retailPrice, service.price_duration || 'mo')}
                      </div>
                      {agentPoints && (
                        <div className="text-xs text-green-600 mt-1">
                          Available: {agentPoints.total_available_points} points (${agentPoints.total_dollar_value})
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Service Price:</span>
              <span>{formatPrice(getSelectedPrice(), service.price_duration || 'mo')}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>{formatPrice(getSelectedPrice(), service.price_duration || 'mo')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleAddToCartAndCheckout}
              className="flex-1"
            >
              Add to Cart
            </Button>
            <Button
              onClick={handleDirectPurchase}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processing..." : "Buy Now"}
            </Button>
          </div>

          {/* Post-Purchase Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">What happens next?</h5>
                  <p className="text-sm text-blue-700">
                    After purchase, you'll be automatically redirected to book your onboarding session 
                    with the vendor. No sales calls needed - just setup and implementation!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};