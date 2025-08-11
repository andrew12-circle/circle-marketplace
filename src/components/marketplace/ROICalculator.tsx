import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calculator, DollarSign } from "lucide-react";

export const ROICalculator = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(1600);
  const [avgCommission, setAvgCommission] = useState(8000);
  const [currentLeads, setCurrentLeads] = useState(12);
  const [expectedIncrease, setExpectedIncrease] = useState(500);

  const calculateROI = () => {
    const yearlyInvestment = monthlyInvestment * 12;
    const newLeads = currentLeads * (expectedIncrease / 100);
    const additionalDeals = newLeads * 0.15; // 15% conversion rate
    const additionalRevenue = additionalDeals * avgCommission * 12;
    const roi = ((additionalRevenue - yearlyInvestment) / yearlyInvestment) * 100;
    
    return {
      yearlyInvestment,
      additionalRevenue,
      netProfit: additionalRevenue - yearlyInvestment,
      roi: Math.max(0, roi)
    };
  };

  const results = calculateROI();

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">ROI Calculator</h3>
          </div>
          <p className="text-gray-600">Calculate your potential return on investment</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="investment">Monthly Investment ($)</Label>
              <Input
                id="investment"
                type="number"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="commission">Average Commission ($)</Label>
              <Input
                id="commission"
                type="number"
                value={avgCommission}
                onChange={(e) => setAvgCommission(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="leads">Current Monthly Leads</Label>
              <Input
                id="leads"
                type="number"
                value={currentLeads}
                onChange={(e) => setCurrentLeads(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="increase">Expected Lead Increase (%)</Label>
              <Input
                id="increase"
                type="number"
                value={expectedIncrease}
                onChange={(e) => setExpectedIncrease(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white/70 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Your Projected Results
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Annual Investment:</span>
                <span className="font-semibold text-red-600">
                  ${results.yearlyInvestment.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Additional Revenue:</span>
                <span className="font-semibold text-green-600">
                  ${results.additionalRevenue.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-300">
                <span className="text-sm font-medium text-green-800">Net Profit:</span>
                <span className="font-bold text-green-800">
                  ${results.netProfit.toLocaleString()}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {results.roi.toFixed(0)}% ROI
                </div>
                <div className="text-sm text-gray-600">
                  Return on Investment
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 mb-3">
            *Based on 15% lead-to-close conversion rate
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            Start Maximizing Your ROI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};