import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ArrowRight } from 'lucide-react';

export const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [purchaseVerified, setPurchaseVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const playbookId = searchParams.get('playbook_id');

  useEffect(() => {
    if (sessionId && playbookId && user) {
      verifyPurchase();
    } else {
      setError('Invalid purchase session');
      setVerifying(false);
    }
  }, [sessionId, playbookId, user]);

  const verifyPurchase = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-playbook-purchase', {
        body: { 
          sessionId,
          playbookId 
        }
      });

      if (error) throw error;

      if (data.success) {
        setPurchaseVerified(true);
        toast({
          title: 'Purchase Successful! 🎉',
          description: 'You now have access to this playbook.',
          duration: 5000
        });
      } else {
        throw new Error('Purchase verification failed');
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
      setError('Failed to verify purchase. Please contact support if you were charged.');
      toast({
        title: 'Verification Error',
        description: 'There was an issue verifying your purchase. Please contact support.',
        variant: 'destructive'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Verifying Purchase...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <CheckCircle className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/academy')} className="w-full">
                Return to Academy
              </Button>
              <Button variant="outline" onClick={() => window.location.href = 'mailto:support@circle.com'}>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (purchaseVerified) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">
              Purchase Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              <p>Your playbook purchase has been confirmed.</p>
              <p>You now have lifetime access to this content.</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/academy/my-playbooks')} 
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                View My Playbooks
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/academy')}
                className="w-full"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Browse More Playbooks
              </Button>
            </div>

            <div className="text-xs text-center text-muted-foreground mt-4">
              <p>Receipt sent to your email address.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};