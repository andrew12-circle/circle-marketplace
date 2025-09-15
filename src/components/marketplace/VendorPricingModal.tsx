import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSelected: (plan: string) => void;
}

const PRICING_PLANS = [
  {
    id: 'standard',
    name: 'Standard Partner',
    price: '$0',
    period: 'month',
    platformFee: '20%',
    description: 'New vendors getting started on the platform.',
    buttonText: 'Create Free Profile',
    buttonVariant: 'outline' as const,
    features: [
      'Standard Marketplace Profile',
      'Receive & Manage Orders',
      'Secure Payment Processing',
      'Standard Support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Partner',
    price: '$79',
    period: 'month',
    platformFee: '15%',
    description: 'Professionals building a consistent stream of clients.',
    buttonText: 'Select Plan',
    buttonVariant: 'default' as const,
    recommended: true,
    features: [
      'Everything in Standard',
      'Enhanced Profile (videos, case studies, portfolio)',
      'Professional Badge',
      'Agent Contribution Analytics',
      'RESPA Compliance Templates',
      'Campaign ROI Tracking',
      'Priority Support',
      'Quarterly Webinar Opportunity'
    ]
  },
  {
    id: 'premier',
    name: 'Premier Partner',
    price: '$349',
    period: 'month',
    platformFee: '10%',
    description: 'Top-tier providers & agencies maximizing profitability.',
    buttonText: 'Select Plan',
    buttonVariant: 'default' as const,
    features: [
      'Everything in Pro Partner',
      'Premium Profile Showcase',
      'Verified Professional Badge',
      'Featured in Weekly Agent Newsletter',
      'Market-Level Trend Insights',
      'Dedicated Success Manager',
      'API Access for Integration',
      'White-label Marketing Materials'
    ]
  }
];

export const VendorPricingModal = ({ isOpen, onClose, onPlanSelected }: VendorPricingModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePlanSelect = async (planId: string) => {
    setIsLoading(true);
    try {
      // Here you would typically save the plan selection to the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      onPlanSelected(planId);
      toast({
        title: "Plan Selected",
        description: `You've successfully selected the ${PRICING_PLANS.find(p => p.id === planId)?.name} plan.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Plans for Marketing Professionals
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            Reach a dedicated audience of real estate agents and grow your client base.
          </p>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {PRICING_PLANS.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''}`}>
              {plan.recommended && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Recommended
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> / {plan.period}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Platform Fee: <span className="font-semibold">{plan.platformFee}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button 
                  variant={plan.buttonVariant}
                  className="w-full"
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isLoading}
                >
                  {isLoading && selectedPlan === plan.id ? 'Selecting...' : plan.buttonText}
                </Button>
                
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature ? (typeof feature === 'object' ? (feature as any).text || JSON.stringify(feature) : String(feature)) : ''}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 text-center text-xs text-muted-foreground">
          * All marketplace listings are for RESPA-compliant co-marketing opportunities only. 
          No referral obligations or expectations. Profile visibility is based on engagement metrics 
          and campaign history, not payment tier.
        </div>
      </DialogContent>
    </Dialog>
  );
};