import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Handshake, TrendingUp, ArrowRight } from 'lucide-react';

interface OnboardingMarketplaceStepProps {
  onNext: () => void;
}

export function OnboardingMarketplaceStep({ onNext }: OnboardingMarketplaceStepProps) {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Marketplace & Co-Pay</CardTitle>
        <p className="text-sm text-muted-foreground">
          Discover services that grow your business
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Service Marketplace</h4>
              <p className="text-xs text-muted-foreground">
                Find vetted vendors for marketing, lead gen, websites, and more
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Handshake className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Co-Pay System</h4>
              <p className="text-xs text-muted-foreground">
                Vendors contribute to your marketing costs when you close deals
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">AI Matching</h4>
              <p className="text-xs text-muted-foreground">
                We recommend services based on your goals and challenge areas
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm text-green-800">Ready to explore?</h4>
              <p className="text-xs text-green-600">
                Browse marketplace after setup
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Coming up
            </Badge>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={onNext} className="w-full">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}