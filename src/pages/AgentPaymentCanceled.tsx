import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, RotateCcw } from 'lucide-react';

export const AgentPaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Payment Canceled</h1>
          <p className="text-muted-foreground">
            Your co-marketing campaign payment was canceled
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
                No charges were made to your payment method. You can restart the 
                co-marketing campaign setup process if you'd like to try again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate('/?ff_facilitator_checkout=on')}
              className="flex-1"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
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
            Your co-marketing campaign was not created. You can restart the process at any time.
          </p>
        </div>
      </div>
    </div>
  );
};