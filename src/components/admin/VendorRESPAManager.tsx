import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Vendor {
  id: string;
  name: string;
  is_respa_regulated?: boolean;
  respa_risk_level?: string;
  location?: string;
}

export const VendorRESPAManager = () => {
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
        .select('id, name, is_respa_regulated, respa_risk_level, location')
        .order('sort_order', { ascending: true })
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

  const updateVendorRESPA = async (vendorId: string, isRegulated: boolean | null, riskLevel: string | null) => {
    setUpdating(prev => ({ ...prev, [vendorId]: true }));
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          is_respa_regulated: isRegulated,
          respa_risk_level: riskLevel,
        })
        .eq('id', vendorId);

      if (error) throw error;

      // Update local state
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId 
          ? { 
              ...vendor, 
              is_respa_regulated: isRegulated,
              respa_risk_level: riskLevel
            }
          : vendor
      ));

      toast({
        title: 'Success',
        description: 'RESPA classification updated successfully',
      });
    } catch (error) {
      console.error('Error updating RESPA classification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update RESPA classification',
        variant: 'destructive',
      });
    } finally {
      setUpdating(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleRESPAUpdate = (vendorId: string) => {
    const regulatedSelect = document.getElementById(`regulated-${vendorId}`) as HTMLSelectElement;
    const riskSelect = document.getElementById(`risk-${vendorId}`) as HTMLSelectElement;
    
    const isRegulated = regulatedSelect?.value === 'true' ? true : regulatedSelect?.value === 'false' ? false : null;
    const riskLevel = riskSelect?.value === 'none' ? null : riskSelect?.value || null;

    updateVendorRESPA(vendorId, isRegulated, riskLevel);
  };

  const getRESPABadge = (vendor: Vendor) => {
    if (vendor.is_respa_regulated === false) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Non-RESPA
        </Badge>
      );
    } else if (vendor.is_respa_regulated === true) {
      const riskLevel = vendor.respa_risk_level || 'high';
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          RESPA ({riskLevel})
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        Auto-detect
      </Badge>
    );
  };

  if (loading) {
    return <p>Loading vendors...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          RESPA Compliance Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manually set RESPA compliance status for each vendor. This overrides automatic keyword detection.
        </p>
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
                  {getRESPABadge(vendor)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">RESPA Status:</label>
                  <Select defaultValue={vendor.is_respa_regulated === null ? 'auto' : vendor.is_respa_regulated?.toString()}>
                    <SelectTrigger className="w-32" id={`regulated-${vendor.id}`}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="false">Non-RESPA</SelectItem>
                      <SelectItem value="true">RESPA Regulated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Risk Level:</label>
                  <Select defaultValue={vendor.respa_risk_level || 'none'}>
                    <SelectTrigger className="w-24" id={`risk-${vendor.id}`}>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => handleRESPAUpdate(vendor.id)}
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