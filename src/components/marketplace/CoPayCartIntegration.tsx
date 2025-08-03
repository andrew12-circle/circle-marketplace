import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCoPayRequests } from '@/hooks/useCoPayRequests';
import { CheckCircle, DollarSign, Percent, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoPayCartIntegrationProps {
  cartItems: any[];
  totalAmount: number;
  onCheckout: (coPayDiscounts: CoPayDiscount[]) => void;
}

interface CoPayDiscount {
  serviceId: string;
  discountAmount: number;
  splitPercentage: number;
  requestId: string;
}

export const CoPayCartIntegration = ({ cartItems, totalAmount, onCheckout }: CoPayCartIntegrationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getApprovedRequests } = useCoPayRequests();
  const { toast } = useToast();

  const approvedRequests = getApprovedRequests();
  
  // Find applicable co-pay discounts for cart items
  const availableDiscounts = cartItems.map(item => {
    const approvedRequest = approvedRequests.find(req => req.service_id === item.id);
    if (!approvedRequest) return null;

    const servicePrice = parseFloat(item.pro_price?.replace(/[^0-9.]/g, '') || item.retail_price?.replace(/[^0-9.]/g, '') || '0');
    const discountAmount = servicePrice * (approvedRequest.requested_split_percentage / 100);

    return {
      serviceId: item.id,
      serviceName: item.title,
      originalPrice: servicePrice,
      discountAmount,
      splitPercentage: approvedRequest.requested_split_percentage,
      requestId: approvedRequest.id,
      vendorName: approvedRequest.vendors?.name
    };
  }).filter(Boolean);

  const totalCoPaySavings = availableDiscounts.reduce((sum, discount) => sum + discount!.discountAmount, 0);
  const finalAmount = totalAmount - totalCoPaySavings;

  const handleCheckoutWithCoPay = async () => {
    setIsProcessing(true);
    try {
      const coPayDiscounts: CoPayDiscount[] = availableDiscounts.map(discount => ({
        serviceId: discount!.serviceId,
        discountAmount: discount!.discountAmount,
        splitPercentage: discount!.splitPercentage,
        requestId: discount!.requestId
      }));

      await onCheckout(coPayDiscounts);
      
      toast({
        title: "Checkout Successful! 🎉",
        description: `You saved $${totalCoPaySavings.toFixed(2)} with co-pay assistance!`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "There was an error processing your checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (availableDiscounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">No Co-Pay Assistance Available</p>
              <p className="text-sm text-gray-600">No approved co-pay requests for these services.</p>
            </div>
            <Button onClick={() => onCheckout([])} disabled={isProcessing}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Proceed to Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Co-Pay Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Co-Pay Assistance Available
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableDiscounts.map((discount) => (
            <div key={discount!.serviceId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{discount!.serviceName}</p>
                <p className="text-sm text-gray-600">Vendor: {discount!.vendorName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    <Percent className="w-3 h-3 mr-1" />
                    {discount!.splitPercentage}% covered
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  -${discount!.discountAmount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  from ${discount!.originalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          
          {/* Total Savings */}
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Total Co-Pay Savings</p>
                <p className="text-sm text-gray-600">Applied to your cart</p>
              </div>
              <p className="text-xl font-bold text-green-600">
                -${totalCoPaySavings.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Co-Pay Assistance:</span>
              <span>-${totalCoPaySavings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Final Total:</span>
              <span>${finalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            onClick={handleCheckoutWithCoPay} 
            disabled={isProcessing}
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : `Checkout with Co-Pay (Save $${totalCoPaySavings.toFixed(2)})`}
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-2">
            Your approved co-pay assistance will be automatically applied
          </p>
        </CardContent>
      </Card>
    </div>
  );
};