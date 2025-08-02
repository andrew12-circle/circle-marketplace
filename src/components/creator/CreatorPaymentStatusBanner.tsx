import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentStatus {
  stripe_onboarding_completed: boolean;
  verified: boolean;
  tax_form_completed: boolean;
}

export const CreatorPaymentStatusBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkPaymentStatus();
    }
  }, [user]);

  const checkPaymentStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_payment_info')
        .select('stripe_onboarding_completed, verified, tax_form_completed')
        .eq('creator_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPaymentStatus(data || {
        stripe_onboarding_completed: false,
        verified: false,
        tax_form_completed: false
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !paymentStatus) return null;

  const isPaymentSetupComplete = 
    paymentStatus.stripe_onboarding_completed && 
    paymentStatus.verified && 
    paymentStatus.tax_form_completed;

  if (isPaymentSetupComplete) {
    return (
      <Alert className="border-green-200 bg-green-50 mb-6">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>Payment setup complete! You're ready to receive earnings.</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/creator-payment-setup')}
              className="ml-4"
            >
              View Details
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 mb-6">
      <AlertTriangle className="w-4 h-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Complete your payment setup to start earning</div>
            <div className="text-sm">
              Setup required: Stripe account, tax forms, and identity verification
            </div>
          </div>
          <Button 
            onClick={() => navigate('/creator-payment-setup')}
            className="gap-2 ml-4"
          >
            <CreditCard className="w-4 h-4" />
            Setup Payments
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};