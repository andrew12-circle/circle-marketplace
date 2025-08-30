// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, Building2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PartnerContribution {
  id: string;
  contribution_amount: number;
  partner_email: string;
  partner_type: string;
  expires_at: string;
  payment_status: string;
  copay_orders: {
    services: {
      title: string;
    };
    vendors: {
      name: string;
    };
  };
}

interface ContactInfo {
  name: string;
  company: string;
  phone: string;
}

export const PartnerCheckout = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contribution, setContribution] = useState<PartnerContribution | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    company: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContribution = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partner_contributions')
          .select(`
            *,
            copay_orders!inner(
              *,
              services!inner(title),
              vendors!inner(name)
            )
          `)
          .eq('invitation_token', token)
          .single();

        if (error || !data) {
          setError('Invalid or expired invitation');
          setLoading(false);
          return;
        }

        // Check if invitation has expired
        if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        // Check if already paid
        if (data.payment_status === 'completed') {
          setError('This contribution has already been paid');
          setLoading(false);
          return;
        }

        setContribution(data as unknown as PartnerContribution);
      } catch (err) {
        console.error('Error fetching contribution:', err);
        setError('Failed to load contribution details');
      } finally {
        setLoading(false);
      }
    };

    fetchContribution();
  }, [token]);

  const handleProceedToPayment = async () => {
    if (!contribution || !token) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('copay-partner-checkout', {
        body: {
          invitationToken: token,
          partnerContactInfo: contactInfo
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open payment in same tab for partner checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contribution) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Partner Co-Marketing Contribution</h1>
          <p className="text-muted-foreground">
            You've been invited to contribute to a co-marketing campaign
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Service Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Service</Label>
              <p className="text-lg">{contribution.copay_orders.services.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Vendor</Label>
              <p className="text-lg">{contribution.copay_orders.vendors.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Partner Type</Label>
              <p className="capitalize">{contribution.partner_type.replace('_', ' ')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Contribution Amount</span>
            </CardTitle>
            <CardDescription>
              Your contribution to this co-marketing campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${contribution.contribution_amount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
            <CardDescription>
              Please provide your details for this partnership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={contactInfo.name}
                onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={contactInfo.company}
                onChange={(e) => setContactInfo(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter your company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription>
            By proceeding, you agree to contribute ${contribution.contribution_amount.toFixed(2)} 
            to this co-marketing campaign. You will be redirected to a secure payment page.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleProceedToPayment}
          disabled={submitting}
          size="lg"
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing Payment...
            </>
          ) : (
            `Proceed to Payment ($${contribution.contribution_amount.toFixed(2)})`
          )}
        </Button>
      </div>
    </div>
  );
};