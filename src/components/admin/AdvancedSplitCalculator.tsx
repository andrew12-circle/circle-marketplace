import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, AlertTriangle, CheckCircle, DollarSign, FileText } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface SplitCalculation {
  serviceType: string;
  serviceValue: number;
  riskLevel: 'high' | 'medium' | 'low';
  splitMethod: 'percentage' | 'fixed' | 'tiered' | 'value-based';
  maxAllowedSplit: number;
  recommendedSplit: number;
  agentPortion: number;
  vendorPortion: number;
  complianceNotes: string[];
  warnings: string[];
  requiredDocumentation: string[];
  approvalLevel: 'auto' | 'manager' | 'legal' | 'prohibited';
}

interface SplitScenario {
  name: string;
  description: string;
  serviceTypes: string[];
  rules: {
    maxSplit: number;
    splitMethod: 'percentage' | 'fixed' | 'tiered' | 'value-based';
    riskLevel: 'high' | 'medium' | 'low';
    approvalRequired: boolean;
  };
  documentation: string[];
  examples: string[];
}

const SPLIT_SCENARIOS: SplitScenario[] = [
  {
    name: 'Standard Technology Services',
    description: 'CRM, websites, software tools, non-RESPA services',
    serviceTypes: ['CRM', 'Website', 'Software', 'Technology', 'Marketing Tools'],
    rules: {
      maxSplit: 100,
      splitMethod: 'percentage',
      riskLevel: 'low',
      approvalRequired: false
    },
    documentation: ['Service Agreement', 'Marketing Materials'],
    examples: ['CRM software subscription', 'Website development', 'Marketing automation tools']
  },
  {
    name: 'Joint Advertising Services',
    description: 'True joint advertising with legitimate business purpose',
    serviceTypes: ['Photography', 'Videography', 'Print Marketing', 'Digital Advertising'],
    rules: {
      maxSplit: 100,
      splitMethod: 'percentage',
      riskLevel: 'low',
      approvalRequired: false
    },
    documentation: ['Joint Marketing Agreement', 'Advertising Materials', 'Cost Breakdown'],
    examples: ['Professional photography split', 'Joint print advertising', 'Shared digital marketing']
  },
  {
    name: 'Adjacent Services (Caution)',
    description: 'Services that may be RESPA-adjacent requiring careful evaluation',
    serviceTypes: ['Home Warranty', 'Insurance', 'Moving Services', 'Home Services'],
    rules: {
      maxSplit: 50,
      splitMethod: 'percentage',
      riskLevel: 'medium',
      approvalRequired: true
    },
    documentation: ['Legal Review', 'Compliance Checklist', 'Value Documentation'],
    examples: ['Home warranty marketing', 'Insurance lead generation', 'Moving company referrals']
  },
  {
    name: 'Settlement Services (PROHIBITED)',
    description: 'Direct settlement services under RESPA - no splits allowed',
    serviceTypes: ['Title Services', 'Mortgage', 'Home Inspection', 'Appraisal', 'Legal Services'],
    rules: {
      maxSplit: 0,
      splitMethod: 'percentage',
      riskLevel: 'high',
      approvalRequired: true
    },
    documentation: ['RESPA Compliance Certificate', 'Legal Prohibition Notice'],
    examples: ['Title company services', 'Mortgage lending', 'Home inspection services']
  },
  {
    name: 'Lead Generation Services',
    description: 'Lead generation and referral services with advertising value',
    serviceTypes: ['Lead Generation', 'Referral Services', 'Lead Nurturing'],
    rules: {
      maxSplit: 100,
      splitMethod: 'value-based',
      riskLevel: 'medium',
      approvalRequired: false
    },
    documentation: ['Lead Source Documentation', 'Advertising Value Proof', 'ROI Analysis'],
    examples: ['Zillow leads', 'Facebook lead generation', 'Referral networks']
  }
];

const VALUE_BASED_TIERS = [
  { min: 0, max: 500, split: 100 },
  { min: 501, max: 2000, split: 90 },
  { min: 2001, max: 5000, split: 75 },
  { min: 5001, max: 10000, split: 60 },
  { min: 10001, max: Infinity, split: 50 }
];

export const AdvancedSplitCalculator = () => {
  const [serviceValue, setServiceValue] = useState<number>(1000);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [customSplitPercentage, setCustomSplitPercentage] = useState<number>(50);
  const [calculation, setCalculation] = useState<SplitCalculation | null>(null);
  const [notes, setNotes] = useState<string>('');

  const calculateSplit = (scenario: SplitScenario, value: number, customSplit?: number): SplitCalculation => {
    let maxAllowedSplit = scenario.rules.maxSplit;
    let recommendedSplit = scenario.rules.maxSplit;
    let approvalLevel: SplitCalculation['approvalLevel'] = 'auto';

    // Apply scenario-specific logic
    if (scenario.rules.splitMethod === 'value-based') {
      const tier = VALUE_BASED_TIERS.find(t => value >= t.min && value <= t.max);
      if (tier) {
        recommendedSplit = Math.min(tier.split, maxAllowedSplit);
      }
    }

    if (scenario.rules.splitMethod === 'tiered') {
      if (value > 5000) recommendedSplit = Math.min(50, maxAllowedSplit);
      else if (value > 2000) recommendedSplit = Math.min(75, maxAllowedSplit);
      else recommendedSplit = maxAllowedSplit;
    }

    // Override with custom split if provided
    const finalSplit = customSplit !== undefined ? Math.min(customSplit, maxAllowedSplit) : recommendedSplit;

    // Determine approval level
    if (scenario.rules.riskLevel === 'high' || maxAllowedSplit === 0) {
      approvalLevel = scenario.rules.riskLevel === 'high' && maxAllowedSplit === 0 ? 'prohibited' : 'legal';
    } else if (scenario.rules.approvalRequired || finalSplit > recommendedSplit) {
      approvalLevel = 'manager';
    }

    // Calculate amounts
    const agentPortion = (value * finalSplit) / 100;
    const vendorPortion = value - agentPortion;

    // Generate compliance notes
    const complianceNotes: string[] = [];
    const warnings: string[] = [];

    if (scenario.rules.riskLevel === 'high') {
      complianceNotes.push('HIGH RISK: This service type requires strict RESPA compliance review');
    }

    if (finalSplit > recommendedSplit) {
      warnings.push(`Split percentage exceeds recommended maximum of ${recommendedSplit}%`);
    }

    if (scenario.rules.riskLevel === 'medium') {
      complianceNotes.push('CAUTION: Ensure true advertising value and avoid quid pro quo arrangements');
    }

    if (value > 10000) {
      complianceNotes.push('High-value transaction: Additional documentation may be required');
    }

    return {
      serviceType: scenario.name,
      serviceValue: value,
      riskLevel: scenario.rules.riskLevel,
      splitMethod: scenario.rules.splitMethod,
      maxAllowedSplit,
      recommendedSplit,
      agentPortion,
      vendorPortion,
      complianceNotes,
      warnings,
      requiredDocumentation: scenario.documentation,
      approvalLevel
    };
  };

  useEffect(() => {
    if (selectedScenario && serviceValue > 0) {
      const scenario = SPLIT_SCENARIOS.find(s => s.name === selectedScenario);
      if (scenario) {
        const calc = calculateSplit(scenario, serviceValue, customSplitPercentage);
        setCalculation(calc);
      }
    }
  }, [selectedScenario, serviceValue, customSplitPercentage]);

  const getApprovalBadge = (level: SplitCalculation['approvalLevel']) => {
    switch (level) {
      case 'auto':
        return <Badge className="bg-green-600">Auto-Approved</Badge>;
      case 'manager':
        return <Badge variant="secondary">Manager Approval</Badge>;
      case 'legal':
        return <Badge variant="destructive">Legal Review Required</Badge>;
      case 'prohibited':
        return <Badge variant="destructive">PROHIBITED</Badge>;
    }
  };

  const exportCalculation = () => {
    if (!calculation) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      calculation,
      notes,
      disclaimer: 'This calculation is for guidance only. Always consult legal counsel for RESPA compliance.'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `split-calculation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Advanced Split Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Service Value ($)</Label>
              <Input
                type="number"
                value={serviceValue}
                onChange={(e) => setServiceValue(Number(e.target.value))}
                placeholder="Enter service value"
              />
            </div>
            <div>
              <Label>Service Type Scenario</Label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service scenario" />
                </SelectTrigger>
                <SelectContent>
                  {SPLIT_SCENARIOS.map((scenario) => (
                    <SelectItem key={scenario.name} value={scenario.name}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedScenario && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Scenario Details</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {SPLIT_SCENARIOS.find(s => s.name === selectedScenario)?.description}
              </p>
              <div className="text-sm">
                <strong>Covers:</strong> {SPLIT_SCENARIOS.find(s => s.name === selectedScenario)?.serviceTypes.join(', ')}
              </div>
            </div>
          )}

          {calculation && calculation.maxAllowedSplit > 0 && (
            <div>
              <Label>Custom Split Percentage (Max: {calculation.maxAllowedSplit}%)</Label>
              <div className="mt-2">
                <Slider
                  value={[customSplitPercentage]}
                  onValueChange={([value]) => setCustomSplitPercentage(value)}
                  max={calculation.maxAllowedSplit}
                  min={0}
                  step={5}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium">{customSplitPercentage}%</span>
                  <span>{calculation.maxAllowedSplit}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {calculation && (
        <div className="space-y-4">
          {/* Calculation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Calculation Results</span>
                {getApprovalBadge(calculation.approvalLevel)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${calculation.agentPortion.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Agent Portion</div>
                  <div className="text-xs text-muted-foreground">
                    {((calculation.agentPortion / calculation.serviceValue) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${calculation.vendorPortion.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Vendor Portion</div>
                  <div className="text-xs text-muted-foreground">
                    {((calculation.vendorPortion / calculation.serviceValue) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${calculation.serviceValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <Badge variant={calculation.riskLevel === 'high' ? 'destructive' : calculation.riskLevel === 'medium' ? 'secondary' : 'default'}>
                    {calculation.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {calculation.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="space-y-1">
                  {calculation.warnings.map((warning, index) => (
                    <div key={index} className="text-yellow-800">{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Compliance Notes */}
          {calculation.complianceNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Compliance Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {calculation.complianceNotes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Required Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {calculation.requiredDocumentation.map((doc, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">{doc}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes, special considerations, or justifications..."
                rows={4}
              />
              <Button onClick={exportCalculation} className="mt-4">
                <DollarSign className="w-4 h-4 mr-2" />
                Export Calculation
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scenario Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Split Scenario Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {SPLIT_SCENARIOS.map((scenario) => (
              <div key={scenario.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{scenario.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant={scenario.rules.riskLevel === 'high' ? 'destructive' : scenario.rules.riskLevel === 'medium' ? 'secondary' : 'default'}>
                      {scenario.rules.riskLevel.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      Max {scenario.rules.maxSplit}%
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{scenario.description}</p>
                <div className="text-xs text-muted-foreground">
                  <strong>Examples:</strong> {scenario.examples.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};