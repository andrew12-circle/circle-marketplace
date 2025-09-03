import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Calculator, DollarSign, TrendingUp } from "lucide-react";

export const EarningsCalculator = () => {
  const [referrals, setReferrals] = useState([10]);
  const [avgRetention, setAvgRetention] = useState([8]);
  const [marketplacePurchases, setMarketplacePurchases] = useState([2]);

  // Constants based on the affiliate program
  const MONTHLY_SUBSCRIPTION = 97;
  const SUBSCRIPTION_COMMISSION = 0.20;
  const MARKETPLACE_COMMISSION = 0.10;
  const AVG_MARKETPLACE_PURCHASE = 299;

  // Calculations
  const monthlyProCommission = referrals[0] * MONTHLY_SUBSCRIPTION * SUBSCRIPTION_COMMISSION;
  const totalProCommission = monthlyProCommission * avgRetention[0];
  const marketplaceCommission = referrals[0] * marketplacePurchases[0] * AVG_MARKETPLACE_PURCHASE * MARKETPLACE_COMMISSION;
  const totalEarnings = totalProCommission + marketplaceCommission;
  const annualEarnings = monthlyProCommission * 12 + marketplaceCommission;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Earnings Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Number of Referrals */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Number of Referrals</Label>
          <div className="space-y-2">
            <Slider
              value={referrals}
              onValueChange={setReferrals}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span className="font-medium text-primary">{referrals[0]} referrals</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Average Retention */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Average Retention (months)</Label>
          <div className="space-y-2">
            <Slider
              value={avgRetention}
              onValueChange={setAvgRetention}
              max={12}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span className="font-medium text-primary">{avgRetention[0]} months</span>
              <span>12</span>
            </div>
          </div>
        </div>

        {/* Marketplace Purchases */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Marketplace Purchases per Referral</Label>
          <div className="space-y-2">
            <Slider
              value={marketplacePurchases}
              onValueChange={setMarketplacePurchases}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-primary">{marketplacePurchases[0]} purchases</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                ${monthlyProCommission.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Monthly Recurring</div>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                ${marketplaceCommission.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Marketplace Total</div>
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <div className="text-3xl font-bold text-primary mb-1">
              ${totalEarnings.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Total Projected Earnings
            </div>
            <div className="text-lg font-semibold text-accent">
              ${annualEarnings.toFixed(0)}/year
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              If sustained for 12 months
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Circle Pro: ${MONTHLY_SUBSCRIPTION}/month × {SUBSCRIPTION_COMMISSION * 100}% commission</p>
            <p>• Marketplace: ~${AVG_MARKETPLACE_PURCHASE} avg × {MARKETPLACE_COMMISSION * 100}% commission</p>
            <p>• Actual results may vary based on referral activity</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};