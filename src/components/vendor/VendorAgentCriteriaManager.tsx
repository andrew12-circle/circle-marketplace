import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Users, DollarSign, MapPin, Award, Building2 } from "lucide-react";

interface VendorAgentCriteria {
  id?: string;
  vendor_id: string;
  min_annual_volume?: number;
  max_annual_volume?: number;
  min_years_experience?: number;
  max_years_experience?: number;
  min_transactions_closed?: number;
  min_conversion_rate?: number;
  target_states?: string[];
  target_markets?: string[];
  allowed_agent_tiers?: string[];
  min_average_commission?: number;
  requires_nmls?: boolean;
  is_active?: boolean;
}

interface VendorAgentCriteriaManagerProps {
  vendorId: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const AGENT_TIERS = ['all', 'new', 'experienced', 'top-producer', 'luxury'];

export const VendorAgentCriteriaManager = ({ vendorId }: VendorAgentCriteriaManagerProps) => {
  const [criteria, setCriteria] = useState<VendorAgentCriteria>({
    vendor_id: vendorId,
    target_states: [],
    target_markets: [],
    allowed_agent_tiers: ['all'],
    requires_nmls: false,
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCriteria();
  }, [vendorId]);

  const loadCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_agent_criteria')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCriteria(data);
      }
    } catch (error) {
      console.error('Error loading criteria:', error);
      toast({
        title: "Error",
        description: "Failed to load agent criteria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCriteria = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_agent_criteria')
        .upsert({
          ...criteria,
          vendor_id: vendorId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent criteria updated successfully",
      });
    } catch (error) {
      console.error('Error saving criteria:', error);
      toast({
        title: "Error",
        description: "Failed to save agent criteria",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStateToggle = (state: string) => {
    const currentStates = criteria.target_states || [];
    const updatedStates = currentStates.includes(state)
      ? currentStates.filter(s => s !== state)
      : [...currentStates, state];
    
    setCriteria({ ...criteria, target_states: updatedStates });
  };

  const handleTierToggle = (tier: string) => {
    const currentTiers = criteria.allowed_agent_tiers || [];
    if (tier === 'all') {
      setCriteria({ ...criteria, allowed_agent_tiers: ['all'] });
      return;
    }
    
    const updatedTiers = currentTiers.includes(tier)
      ? currentTiers.filter(t => t !== tier)
      : [...currentTiers.filter(t => t !== 'all'), tier];
    
    setCriteria({ ...criteria, allowed_agent_tiers: updatedTiers.length ? updatedTiers : ['all'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading criteria...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent Selection Criteria
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set criteria for which agents you want to co-market with. Only agents meeting these requirements will see your vendor profile.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Volume Criteria */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold">Volume Requirements</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_volume">Minimum Annual Volume</Label>
                <Input
                  id="min_volume"
                  type="number"
                  placeholder="e.g., 5000000"
                  value={criteria.min_annual_volume || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    min_annual_volume: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_volume">Maximum Annual Volume</Label>
                <Input
                  id="max_volume"
                  type="number"
                  placeholder="e.g., 50000000"
                  value={criteria.max_annual_volume || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    max_annual_volume: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
            </div>
          </div>

          {/* Experience Criteria */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Experience Requirements</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_years">Minimum Years Experience</Label>
                <Input
                  id="min_years"
                  type="number"
                  placeholder="e.g., 2"
                  value={criteria.min_years_experience || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    min_years_experience: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_years">Maximum Years Experience</Label>
                <Input
                  id="max_years"
                  type="number"
                  placeholder="e.g., 15"
                  value={criteria.max_years_experience || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    max_years_experience: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
            </div>
          </div>

          {/* Performance Criteria */}
          <div className="space-y-4">
            <h3 className="font-semibold">Performance Requirements</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_transactions">Min Transactions/Year</Label>
                <Input
                  id="min_transactions"
                  type="number"
                  placeholder="e.g., 12"
                  value={criteria.min_transactions_closed || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    min_transactions_closed: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_conversion">Min Conversion Rate (%)</Label>
                <Input
                  id="min_conversion"
                  type="number"
                  placeholder="e.g., 15"
                  value={criteria.min_conversion_rate || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    min_conversion_rate: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_commission">Min Avg Commission</Label>
                <Input
                  id="min_commission"
                  type="number"
                  placeholder="e.g., 8000"
                  value={criteria.min_average_commission || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    min_average_commission: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
            </div>
          </div>

          {/* Geographic Criteria */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold">Geographic Requirements</h3>
            </div>
            <div className="space-y-2">
              <Label>Target States (leave empty for all states)</Label>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {US_STATES.map((state) => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox
                      id={state}
                      checked={criteria.target_states?.includes(state) || false}
                      onCheckedChange={() => handleStateToggle(state)}
                    />
                    <label htmlFor={state} className="text-sm font-medium">
                      {state}
                    </label>
                  </div>
                ))}
              </div>
              {criteria.target_states && criteria.target_states.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {criteria.target_states.map((state) => (
                    <Badge key={state} variant="secondary" className="text-xs">
                      {state}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Agent Tier Criteria */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold">Agent Tier Requirements</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {AGENT_TIERS.map((tier) => (
                <div key={tier} className="flex items-center space-x-2">
                  <Checkbox
                    id={tier}
                    checked={criteria.allowed_agent_tiers?.includes(tier) || false}
                    onCheckedChange={() => handleTierToggle(tier)}
                  />
                  <label htmlFor={tier} className="text-sm font-medium capitalize">
                    {tier.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="font-semibold">Additional Requirements</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_nmls"
                checked={criteria.requires_nmls || false}
                onCheckedChange={(checked) => setCriteria({
                  ...criteria,
                  requires_nmls: checked as boolean
                })}
              />
              <label htmlFor="requires_nmls" className="text-sm font-medium">
                Require NMLS License
              </label>
            </div>
          </div>

          {/* Active Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={criteria.is_active || false}
                onCheckedChange={(checked) => setCriteria({
                  ...criteria,
                  is_active: checked as boolean
                })}
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Enable Agent Filtering (uncheck to show all agents)
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveCriteria} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Criteria
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};