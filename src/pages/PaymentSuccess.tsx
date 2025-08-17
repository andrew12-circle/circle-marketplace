import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, ArrowLeft, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  item_title: string;
  item_price: number;
  quantity: number;
  item_type: string;
}

interface VerificationResult {
  success: boolean;
  order_id: string;
  payment_status: string;
  order_status: string;
  items: OrderItem[];
  total_amount: number;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("No session ID found");
        setLoading(false);
        return;
      }

      try {
        console.log("Verifying payment for session:", sessionId);
        
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId }
        });

        if (error) {
          console.error("Verification error:", error);
          setError(error.message || "Failed to verify payment");
          return;
        }

        console.log("Verification result:", data);
        setVerificationResult(data);

        if (data.success && data.payment_status === 'paid') {
          toast({
            title: "Payment Successful!",
            description: "Your order has been confirmed and processed.",
          });
        } else {
          setError("Payment verification failed or payment was not completed");
        }

      } catch (err) {
        console.error("Payment verification error:", err);
        setError("Failed to verify payment status");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Verifying Payment</h3>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payment Verification Failed</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Header */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground text-center text-lg mb-4">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            {sessionId && (
              <p className="text-sm text-muted-foreground">
                Order Reference: <span className="font-mono">{sessionId.slice(-8)}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        {verificationResult && (
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Order ID:</span>
                <span className="font-mono text-sm">{verificationResult.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment Status:</span>
                <span className="capitalize text-emerald-600 font-medium">
                  {verificationResult.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-semibold">${verificationResult.total_amount.toFixed(2)}</span>
              </div>

              {verificationResult.items && verificationResult.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Items Purchased:</h4>
                  <div className="space-y-2">
                    {verificationResult.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.item_title} {item.quantity > 1 && `(×${item.quantity})`}</span>
                        <span>${(item.item_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Ready to Get Started</h4>
              <p className="text-blue-800 text-sm">
                You now have access to your purchased services. Check your email for detailed instructions
                and access information.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/marketplace')} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;