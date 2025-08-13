import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pause, DollarSign, TrendingDown, X, AlertTriangle } from "lucide-react";

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageSubscriptionModal = ({ isOpen, onClose, onSuccess }: ManageSubscriptionModalProps) => {
  const [step, setStep] = useState<'initial' | 'pause' | 'discount' | 'downgrade' | 'cancel'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePauseSubscription = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('pause-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: { pauseDays: 90 }
      });

      if (error) throw error;

      toast({
        title: "Subscription Paused",
        description: "Your subscription has been paused for 90 days. You'll be billed again automatically after the pause period.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('apply-discount', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: { discountPercent: 50, durationMonths: 2 }
      });

      if (error) throw error;

      toast({
        title: "Discount Applied",
        description: "You'll receive 50% off for the next 2 months, then resume at full price.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('downgrade-plan', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: { discountPercent: 30, isPermanent: false }
      });

      if (error) throw error;

      toast({
        title: "Plan Modified",
        description: "You'll receive 30% off your current plan. You can upgrade back anytime.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to modify plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled. You'll retain access until your current billing period ends.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInitialStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">We'd hate to see you go!</h3>
        <p className="text-muted-foreground">
          Before you make any changes, let us help you find the perfect solution.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-auto p-4 justify-start space-x-3"
          onClick={() => setStep('pause')}
        >
          <Pause className="h-5 w-5 text-blue-500" />
          <div className="text-left">
            <div className="font-medium">Pause for 90 days</div>
            <div className="text-sm text-muted-foreground">Take a break and resume later</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full h-auto p-4 justify-start space-x-3"
          onClick={() => setStep('discount')}
        >
          <DollarSign className="h-5 w-5 text-green-500" />
          <div className="text-left">
            <div className="font-medium">Get 50% off for 2 months</div>
            <div className="text-sm text-muted-foreground">Special discount, then resume normal pricing</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full h-auto p-4 justify-start space-x-3"
          onClick={() => setStep('downgrade')}
        >
          <TrendingDown className="h-5 w-5 text-orange-500" />
          <div className="text-left">
            <div className="font-medium">Reduce your plan</div>
            <div className="text-sm text-muted-foreground">Lower cost with core features</div>
          </div>
        </Button>

        <Separator />

        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setStep('cancel')}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel Subscription
        </Button>
      </div>
    </div>
  );

  const renderPauseStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Pause className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Pause Your Subscription</h3>
        <p className="text-muted-foreground">
          Your subscription will be paused for 90 days. You won't be charged during this time, 
          and billing will automatically resume afterward.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You'll lose access to premium features during the pause period.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">
          Back
        </Button>
        <Button onClick={handlePauseSubscription} disabled={isLoading} className="flex-1">
          {isLoading ? "Processing..." : "Pause Subscription"}
        </Button>
      </div>
    </div>
  );

  const renderDiscountStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Special Discount Offer</h3>
        <p className="text-muted-foreground">
          Get 50% off your subscription for the next 2 months, then resume at regular pricing.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="text-sm font-medium">What you get:</div>
        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
          <li>• 50% off for 2 billing cycles</li>
          <li>• Full access to all premium features</li>
          <li>• Automatic return to regular pricing</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">
          Back
        </Button>
        <Button onClick={handleApplyDiscount} disabled={isLoading} className="flex-1">
          {isLoading ? "Processing..." : "Apply Discount"}
        </Button>
      </div>
    </div>
  );

  const renderDowngradeStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <TrendingDown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Reduce Your Plan</h3>
        <p className="text-muted-foreground">
          Get 30% off your current plan while keeping core functionality.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="text-sm font-medium">Modified plan includes:</div>
        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
          <li>• Core marketplace access</li>
          <li>• Basic AI recommendations</li>
          <li>• 30% discount on current price</li>
          <li>• Upgrade anytime</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">
          Back
        </Button>
        <Button onClick={handleDowngrade} disabled={isLoading} className="flex-1">
          {isLoading ? "Processing..." : "Modify Plan"}
        </Button>
      </div>
    </div>
  );

  const renderCancelStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <X className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Cancel Subscription</h3>
        <p className="text-muted-foreground">
          Are you sure you want to cancel? You'll lose access to all premium features.
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This action cannot be undone. You'll need to resubscribe to regain access.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">
          Back
        </Button>
        <Button variant="destructive" onClick={handleCancel} disabled={isLoading} className="flex-1">
          {isLoading ? "Processing..." : "Cancel Now"}
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'pause': return renderPauseStep();
      case 'discount': return renderDiscountStep();
      case 'downgrade': return renderDowngradeStep();
      case 'cancel': return renderCancelStep();
      default: return renderInitialStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
        </DialogHeader>
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};