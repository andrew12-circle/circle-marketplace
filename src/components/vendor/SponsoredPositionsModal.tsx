import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Star, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SponsoredTier {
  id: string;
  tier: string;
  name: string;
  description: string;
  price_monthly: number;
  price_quarterly: number;
  price_yearly: number;
  max_positions: number;
  features: string[];
  is_active: boolean;
}

interface SponsoredPositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
}

export const SponsoredPositionsModal = ({ isOpen, onClose, vendorId }: SponsoredPositionsModalProps) => {
  const [tiers, setTiers] = useState<SponsoredTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTiers();
    }
  }, [isOpen]);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsored_pricing')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching sponsored tiers:', error);
      toast({
        title: "Error",
        description: "Failed to load sponsored position options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (tier: SponsoredTier) => {
    switch (selectedDuration) {
      case 'quarterly':
        return tier.price_quarterly;
      case 'yearly':
        return tier.price_yearly;
      default:
        return tier.price_monthly;
    }
  };

  const getDurationText = () => {
    switch (selectedDuration) {
      case 'quarterly':
        return '3 months';
      case 'yearly':
        return '12 months';
      default:
        return '1 month';
    }
  };

  const getSavingsText = (tier: SponsoredTier) => {
    const monthlyTotal = tier.price_monthly * (selectedDuration === 'quarterly' ? 3 : 12);
    const selectedPrice = getPrice(tier);
    
    if (selectedDuration === 'monthly') return null;
    
    const savings = monthlyTotal - selectedPrice;
    const percentSaved = Math.round((savings / monthlyTotal) * 100);
    
    return `Save $${savings.toFixed(0)} (${percentSaved}% off)`;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'featured':
        return <Star className="w-6 h-6 text-blue-500" />;
      case 'premium':
        return <Zap className="w-6 h-6 text-purple-500" />;
      case 'top_ranked':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'featured':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'top_ranked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handlePurchase = async (tier: SponsoredTier) => {
    setPurchasing(tier.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-sponsored-checkout', {
        body: {
          vendorId,
          tierId: tier.id,
          tier: tier.tier,
          duration: selectedDuration,
          amount: getPrice(tier)
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Boost Your Visibility</DialogTitle>
          <p className="text-muted-foreground">
            Choose a sponsored position tier to increase your visibility and attract more customers
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={selectedDuration} onValueChange={(value) => setSelectedDuration(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedDuration} className="mt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {tiers.map((tier) => (
                    <Card 
                      key={tier.id} 
                      className={`relative ${tier.tier === 'premium' ? 'border-purple-200 shadow-lg' : ''}`}
                    >
                      {tier.tier === 'premium' && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-2">
                          {getTierIcon(tier.tier)}
                        </div>
                        <CardTitle className="text-xl">{tier.name}</CardTitle>
                        <CardDescription className="text-sm">{tier.description}</CardDescription>
                        
                        <div className="mt-4">
                          <div className="text-3xl font-bold">
                            ${getPrice(tier).toFixed(0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            for {getDurationText()}
                          </div>
                          {getSavingsText(tier) && (
                            <div className="text-sm text-green-600 font-medium mt-1">
                              {getSavingsText(tier)}
                            </div>
                          )}
                        </div>

                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${getTierBadgeColor(tier.tier)}`}
                        >
                          {tier.max_positions} spots available
                        </Badge>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {tier.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          className="w-full"
                          onClick={() => handlePurchase(tier)}
                          disabled={purchasing === tier.id}
                          variant={tier.tier === 'premium' ? 'default' : 'outline'}
                        >
                          {purchasing === tier.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Get ${tier.name}`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-center text-sm text-muted-foreground">
              <p>All plans include analytics dashboard and customer support</p>
              <p>Secure payment processing by Stripe</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};