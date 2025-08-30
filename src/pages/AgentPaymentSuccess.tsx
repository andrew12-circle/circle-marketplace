// @ts-nocheck
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, DollarSign, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AgentPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [partnerLink, setPartnerLink] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Simple query to avoid TypeScript recursion issues
        const { data: orders } = await supabase
          .from('copay_orders')
          .select('id, order_number, agent_amount, service_id, vendor_id, agent_stripe_payment_intent_id')
          .eq('agent_stripe_payment_intent_id', sessionId);

        if (orders && orders.length > 0) {
          const order = orders[0];
          
          // Get service and vendor data separately
          const { data: service } = await supabase.from('services').select('title').eq('id', order.service_id).maybeSingle();
          const { data: vendor } = await supabase.from('vendors').select('name').eq('id', order.vendor_id).maybeSingle();
          const { data: contributions } = await supabase.from('partner_contributions').select('*').eq('copay_order_id', order.id);
          
          // Verify payment
          const { data: verificationResult } = await supabase.functions.invoke('copay-verify-payment', {
            body: { sessionId, type: 'agent', orderId: order.id }
          });

          if (verificationResult?.success) {
            setVerified(true);
            setOrderDetails({
              ...order,
              services: { title: service?.title || 'Unknown Service' },
              vendors: { name: vendor?.name || 'Unknown Vendor' }
            });
            
            if (contributions && contributions.length > 0) {
              const contribution = contributions[0];
              setPartnerLink(`${window.location.origin}/partner-checkout/${contribution.invitation_token}`);
            }
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const copyPartnerLink = async () => {
    if (partnerLink) {
      try {
        await navigator.clipboard.writeText(partnerLink);
        toast.success('Partner link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verifying payment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">Your co-marketing campaign payment has been processed</p>
        </div>

        {verified && orderDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Order Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                  <p className="text-lg font-mono">{orderDetails.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                  <p className="text-lg font-semibold">${orderDetails.agent_amount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service</p>
                  <p className="text-lg">{orderDetails.services?.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                  <p className="text-lg">{orderDetails.vendors?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {partnerLink && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5" />
                <span>Partner Invitation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {partnerLink}
                </div>
                <Button onClick={copyPartnerLink} variant="outline">Copy Link</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Button onClick={() => navigate('/orders')} className="w-full" size="lg">
            View My Orders
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Return to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};