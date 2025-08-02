import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Building, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Shield,
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PaymentSetupStatus {
  stripe_account_id?: string;
  stripe_onboarding_completed: boolean;
  tax_form_completed: boolean;
  verified: boolean;
  payment_method: string;
  minimum_payout_amount: number;
}

export const CreatorPaymentSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentSetupStatus>({
    stripe_onboarding_completed: false,
    tax_form_completed: false,
    verified: false,
    payment_method: 'stripe',
    minimum_payout_amount: 25.00
  });
  const [taxInfo, setTaxInfo] = useState({
    tax_id: '',
    tax_classification: 'individual',
    w9_completed: false
  });

  useEffect(() => {
    if (user) {
      checkPaymentSetupStatus();
    }
  }, [user]);

  const checkPaymentSetupStatus = async () => {
    if (!user) return;

    try {
      setCheckingStatus(true);
      
      // Check if payment info exists
      const { data: paymentInfo, error } = await supabase
        .from('creator_payment_info')
        .select('*')
        .eq('creator_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (paymentInfo) {
        setPaymentStatus({
          stripe_account_id: paymentInfo.stripe_account_id,
          stripe_onboarding_completed: paymentInfo.stripe_onboarding_completed || false,
          tax_form_completed: paymentInfo.tax_form_completed || false,
          verified: paymentInfo.verified || false,
          payment_method: paymentInfo.payment_method || 'stripe',
          minimum_payout_amount: paymentInfo.minimum_payout_amount || 25.00
        });
        
        setTaxInfo({
          tax_id: paymentInfo.tax_id || '',
          tax_classification: 'individual',
          w9_completed: paymentInfo.tax_form_completed || false
        });

        // If we have a Stripe account, check its status
        if (paymentInfo.stripe_account_id) {
          await checkStripeAccountStatus();
        }
      }
    } catch (error) {
      console.error('Error checking payment setup:', error);
      toast({
        title: 'Error',
        description: 'Failed to check payment setup status',
        variant: 'destructive'
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const checkStripeAccountStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-creator-onboarding');
      
      if (error) throw error;
      
      if (data) {
        setPaymentStatus(prev => ({
          ...prev,
          stripe_onboarding_completed: data.onboarding_completed || false,
          verified: data.verified || false
        }));

        // Update database with latest status
        if (data.onboarding_completed !== undefined || data.verified !== undefined) {
          await supabase
            .from('creator_payment_info')
            .update({
              stripe_onboarding_completed: data.onboarding_completed,
              verified: data.verified,
              updated_at: new Date().toISOString()
            })
            .eq('creator_id', user!.id);
        }
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };

  const startStripeOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('creator-stripe-onboarding');
      
      if (error) throw error;
      
      if (data?.onboarding_url) {
        // Open Stripe onboarding in a new tab
        window.open(data.onboarding_url, '_blank');
        
        // Update our records with the account ID
        if (data.account_id) {
          await supabase
            .from('creator_payment_info')
            .upsert({
              creator_id: user.id,
              stripe_account_id: data.account_id,
              payment_method: 'stripe',
              updated_at: new Date().toISOString()
            });
          
          setPaymentStatus(prev => ({
            ...prev,
            stripe_account_id: data.account_id
          }));
        }
        
        toast({
          title: 'Stripe Onboarding Started',
          description: 'Complete your Stripe setup in the new tab, then return here to continue.'
        });
      }
    } catch (error) {
      console.error('Error starting Stripe onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to start Stripe onboarding. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const submitTaxInformation = async () => {
    if (!user || !taxInfo.tax_id) return;

    setLoading(true);
    try {
      await supabase
        .from('creator_payment_info')
        .upsert({
          creator_id: user.id,
          tax_id: taxInfo.tax_id,
          tax_form_completed: true,
          updated_at: new Date().toISOString()
        });

      setPaymentStatus(prev => ({
        ...prev,
        tax_form_completed: true
      }));

      setTaxInfo(prev => ({
        ...prev,
        w9_completed: true
      }));

      toast({
        title: 'Tax Information Saved',
        description: 'Your tax information has been saved successfully.'
      });
    } catch (error) {
      console.error('Error saving tax info:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tax information. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    let total = 3;
    
    if (paymentStatus.stripe_onboarding_completed) completed++;
    if (paymentStatus.verified) completed++;
    if (paymentStatus.tax_form_completed) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const canReceivePayments = () => {
    return paymentStatus.stripe_onboarding_completed && 
           paymentStatus.verified && 
           paymentStatus.tax_form_completed;
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking payment setup status...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className={`border-2 ${canReceivePayments() ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {canReceivePayments() ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <CardTitle>Payment Setup Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {canReceivePayments() 
                    ? 'Ready to receive payments!' 
                    : 'Complete setup to start earning'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={completionPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Setup Steps */}
      <div className="grid gap-6">
        {/* Step 1: Stripe Account Setup */}
        <Card className={`${paymentStatus.stripe_onboarding_completed ? 'border-green-200' : 'border-muted'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {paymentStatus.stripe_onboarding_completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg">Stripe Account Setup</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Connect your Stripe account to receive payments
                  </p>
                </div>
              </div>
              {paymentStatus.stripe_onboarding_completed && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!paymentStatus.stripe_onboarding_completed ? (
              <div className="space-y-4">
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    Stripe is our secure payment processor. You'll need to provide business information
                    and verify your identity to receive payments.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={startStripeOnboarding} 
                  disabled={loading}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {loading ? 'Starting...' : 'Setup Stripe Account'}
                </Button>
              </div>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Stripe account setup completed successfully! 
                  {paymentStatus.verified && ' Account verified and ready for payments.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Account Verification */}
        <Card className={`${paymentStatus.verified ? 'border-green-200' : 'border-muted'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {paymentStatus.verified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Building className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg">Account Verification</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Verify your account to enable payouts
                  </p>
                </div>
              </div>
              {paymentStatus.verified && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!paymentStatus.verified ? (
              <div className="space-y-4">
                <Alert>
                  <Clock className="w-4 h-4" />
                  <AlertDescription>
                    {paymentStatus.stripe_onboarding_completed 
                      ? 'Account verification is in progress. This usually takes 1-2 business days.'
                      : 'Complete Stripe setup first to begin verification process.'}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={checkStripeAccountStatus} 
                  variant="outline"
                  disabled={loading || !paymentStatus.stripe_onboarding_completed}
                >
                  Check Verification Status
                </Button>
              </div>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Account verified successfully! You can now receive payments.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Tax Information */}
        <Card className={`${paymentStatus.tax_form_completed ? 'border-green-200' : 'border-muted'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {paymentStatus.tax_form_completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg">Tax Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Provide tax information for payment reporting
                  </p>
                </div>
              </div>
              {paymentStatus.tax_form_completed && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!paymentStatus.tax_form_completed ? (
              <div className="space-y-4">
                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    We need your tax information to issue 1099 forms for payments over $600 per year.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_id">Tax ID / SSN *</Label>
                    <Input
                      id="tax_id"
                      value={taxInfo.tax_id}
                      onChange={(e) => setTaxInfo(prev => ({ ...prev, tax_id: e.target.value }))}
                      placeholder="XXX-XX-XXXX"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_classification">Tax Classification</Label>
                    <Select
                      value={taxInfo.tax_classification}
                      onValueChange={(value) => setTaxInfo(prev => ({ ...prev, tax_classification: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={submitTaxInformation}
                  disabled={loading || !taxInfo.tax_id}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Tax Information'}
                </Button>
              </div>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Tax information completed successfully!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout Information */}
      {canReceivePayments() && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payout Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Revenue Share:</strong> 75%
              </div>
              <div>
                <strong>Minimum Payout:</strong> ${paymentStatus.minimum_payout_amount}
              </div>
              <div>
                <strong>Payout Schedule:</strong> Monthly (1st of each month)
              </div>
              <div>
                <strong>Payment Method:</strong> Direct Deposit via Stripe
              </div>
            </div>
            
            <Separator />
            
            <Alert>
              <DollarSign className="w-4 h-4" />
              <AlertDescription>
                You're all set! Earnings will be automatically calculated and paid out monthly. 
                You'll receive an email notification before each payout with the details.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};