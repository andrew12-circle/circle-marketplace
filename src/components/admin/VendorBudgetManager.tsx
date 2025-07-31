import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Save, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Vendor {
  id: string;
  name: string;
  ad_budget_min?: number;
  ad_budget_max?: number;
  budget_currency?: string;
  location?: string;
}

export const VendorBudgetManager = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, ad_budget_min, ad_budget_max, budget_currency, location')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVendorBudget = async (vendorId: string, minBudget: number | null, maxBudget: number | null) => {
    setUpdating(prev => ({ ...prev, [vendorId]: true }));
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          ad_budget_min: minBudget ? minBudget * 100 : null, // Convert to cents
          ad_budget_max: maxBudget ? maxBudget * 100 : null, // Convert to cents
        })
        .eq('id', vendorId);

      if (error) throw error;

      // Update local state
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId 
          ? { 
              ...vendor, 
              ad_budget_min: minBudget ? minBudget * 100 : undefined,
              ad_budget_max: maxBudget ? maxBudget * 100 : undefined
            }
          : vendor
      ));

      toast({
        title: 'Success',
        description: 'Vendor budget updated successfully',
      });
    } catch (error) {
      console.error('Error updating vendor budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vendor budget',
        variant: 'destructive',
      });
    } finally {
      setUpdating(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleBudgetUpdate = (vendorId: string) => {
    const minInput = document.getElementById(`min-${vendorId}`) as HTMLInputElement;
    const maxInput = document.getElementById(`max-${vendorId}`) as HTMLInputElement;
    
    const minBudget = minInput?.value ? parseInt(minInput.value) : null;
    const maxBudget = maxInput?.value ? parseInt(maxInput.value) : null;

    if (minBudget && maxBudget && minBudget > maxBudget) {
      toast({
        title: 'Invalid Range',
        description: 'Minimum budget cannot be greater than maximum budget',
        variant: 'destructive',
      });
      return;
    }

    updateVendorBudget(vendorId, minBudget, maxBudget);
  };

  if (loading) {
    return <p>Loading vendors...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Vendor Ad Budget Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{vendor.name}</h3>
                  {vendor.location && (
                    <Badge variant="outline" className="text-xs">
                      {vendor.location}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Current Budget: {vendor.ad_budget_min && vendor.ad_budget_max 
                    ? `$${(vendor.ad_budget_min / 100).toLocaleString()} - $${(vendor.ad_budget_max / 100).toLocaleString()}/mo`
                    : 'Not set'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Min Budget:</label>
                  <Input
                    id={`min-${vendor.id}`}
                    type="number"
                    placeholder="1000"
                    defaultValue={vendor.ad_budget_min ? vendor.ad_budget_min / 100 : ''}
                    className="w-24"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Max Budget:</label>
                  <Input
                    id={`max-${vendor.id}`}
                    type="number"
                    placeholder="5000"
                    defaultValue={vendor.ad_budget_max ? vendor.ad_budget_max / 100 : ''}
                    className="w-24"
                    min="0"
                  />
                </div>

                <Button
                  onClick={() => handleBudgetUpdate(vendor.id)}
                  disabled={updating[vendor.id]}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  {updating[vendor.id] ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ))}
          
          {vendors.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No vendors found. Import vendors first.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};