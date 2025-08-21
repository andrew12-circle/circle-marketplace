import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, RotateCcw } from 'lucide-react';

export const PartnerPaymentCanceled = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleRetryPayment = () => {
    if (token) {
      navigate(`/partner-checkout/${token}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Payment Canceled</h1>
          <p className="text-muted-foreground">
            Your payment was canceled and no charges were made
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What happened?</CardTitle>
            <CardDescription>
              You chose to cancel the payment process or closed the payment window
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                No charges were made to your payment method. Your co-marketing contribution 
                invitation is still valid and you can retry the payment if desired.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {token && (
              <Button 
                onClick={handleRetryPayment}
                className="flex-1"
                size="lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
            )}
            
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Return to Homepage
            </Button>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            If you need assistance, please contact the person who sent you this invitation.
          </p>
        </div>
      </div>
    </div>
  );
};