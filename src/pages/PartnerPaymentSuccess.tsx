// @ts-nocheck
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const PartnerPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const sessionId = searchParams.get('session_id');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !token) {
        setLoading(false);
        return;
      }

      try {
        // Get contribution details first
        const { data: contribution } = await supabase
          .from('partner_contributions')
          .select('*')
          .eq('invitation_token', token)
          .single();

        if (contribution) {
          // Get related order details
          const { data: order } = await supabase
            .from('copay_orders')
            .select(`
              *,
              services(title)
            `)
            .eq('id', contribution.copay_order_id)
            .single();

          // Verify payment with Stripe
          const { data: verificationResult } = await supabase.functions.invoke('copay-verify-payment', {
            body: {
              sessionId,
              type: 'partner',
              contributionId: contribution.id
            }
          });

          if (verificationResult?.success && order) {
            setVerified(true);
            setPaymentDetails({
              amount: contribution.contribution_amount,
              serviceName: (order.services as any)?.title || 'Unknown Service',
              vendorName: 'Circle Platform',
              partnerType: contribution.partner_type
            });
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, token]);

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
          <p className="text-muted-foreground">
            Thank you for your co-marketing contribution
          </p>
        </div>

        {verified && paymentDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Contribution Details</span>
              </CardTitle>
              <CardDescription>
                Your payment has been processed successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                  <p className="text-lg font-semibold">${paymentDetails.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Partner Type</p>
                  <p className="text-lg capitalize">{paymentDetails.partnerType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service</p>
                  <p className="text-lg">{paymentDetails.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                  <p className="text-lg">{paymentDetails.vendorName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your contribution has been successfully processed. The vendor and agent will be notified 
            of your participation in this co-marketing campaign.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <p className="text-center text-muted-foreground">
            You will receive a confirmation email shortly with the payment details.
          </p>
          
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            size="lg"
          >
            Complete
          </Button>
        </div>
      </div>
    </div>
  );
};