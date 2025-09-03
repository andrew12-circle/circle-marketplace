import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, DollarSign, TrendingUp, Users } from "lucide-react";

export const EarningsCalculator = () => {
  const [agents, setAgents] = useState(50);
  const [convertPercent, setConvertPercent] = useState(60);
  const [monthlySpend, setMonthlySpend] = useState(250);
  const [months, setMonths] = useState(12);
  const [proOnly, setProOnly] = useState(false);

  // Constants based on the affiliate program
  const PRO_PRICE = 97;
  const PRO_CUT = 0.20; // 20% of $97 = $19.40
  const MARKETPLACE_TAKE = 0.20; // Circle keeps ~20% of GMV
  const AFFIL_OF_TAKE = 0.10; // Affiliate gets 10% of Circle's take
  const GMV_CUT = AFFIL_OF_TAKE * MARKETPLACE_TAKE; // 2% of GMV

  // Calculations
  const paying = agents * (convertPercent / 100);
  const cohortForSpend = proOnly ? paying : agents;
  
  const proMonthly = paying * (PRO_PRICE * PRO_CUT); // paying × $19.40
  const mktMonthly = cohortForSpend * (monthlySpend * GMV_CUT); // cohort × 2% × spend
  const totalMonthly = proMonthly + mktMonthly;
  const totalYearly = totalMonthly * months;
  const perAgentMonthly = agents > 0 ? totalMonthly / agents : 0;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    });
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Earnings Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Agents you recruit</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={agents}
              onChange={(e) => setAgents(Math.max(0, Number(e.target.value) || 0))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Percent who upgrade to Pro</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={convertPercent}
              onChange={(e) => setConvertPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Avg monthly Marketplace spend per referred agent (GMV)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={monthlySpend}
              onChange={(e) => setMonthlySpend(Math.max(0, Number(e.target.value) || 0))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Months for annual calc</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={months}
              onChange={(e) => setMonths(Math.max(1, Number(e.target.value) || 12))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="pro-only"
            checked={proOnly}
            onCheckedChange={(checked) => setProOnly(!!checked)}
          />
          <Label htmlFor="pro-only" className="text-sm font-medium">
            Count Marketplace spend from Pro members only
          </Label>
        </div>

        {/* Results */}
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg border">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(proMonthly)}
              </div>
              <div className="text-xs text-muted-foreground">Monthly from Pro</div>
            </div>
            
            <div className="text-center p-4 bg-background/50 rounded-lg border">
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(mktMonthly)}
              </div>
              <div className="text-xs text-muted-foreground">Monthly from Marketplace</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalMonthly)}
              </div>
              <div className="text-xs text-muted-foreground">Total monthly</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalYearly)}
              </div>
              <div className="text-xs text-muted-foreground">Total yearly</div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Per paying agent monthly average: <span className="font-medium text-primary">{formatCurrency(perAgentMonthly)}</span>
          </div>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium mb-2">Assumptions</summary>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Pro price = ${PRO_PRICE} per month</li>
              <li>Affiliate share on Pro = {PRO_CUT * 100}% → ${(PRO_PRICE * PRO_CUT).toFixed(2)} per paying agent per month</li>
              <li>Marketplace take rate ~{MARKETPLACE_TAKE * 100}% of GMV and affiliate share = {AFFIL_OF_TAKE * 100}% of our take → you earn {GMV_CUT * 100}% of GMV</li>
            </ul>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};