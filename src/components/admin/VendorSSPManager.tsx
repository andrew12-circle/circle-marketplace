import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building, Search } from 'lucide-react';

interface Vendor {
  user_id: string;
  business_name?: string;
  display_name?: string;
  is_settlement_service_provider?: boolean;
  specialties?: string[];
  vendor_enabled?: boolean;
}

const VendorSSPManager = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, business_name, display_name, is_settlement_service_provider, specialties, vendor_enabled')
        .eq('vendor_enabled' as any, true as any)
        .order('business_name');

      if (error) throw error;
      setVendors(data as any || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        (vendor.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (vendor.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
    }

    setFilteredVendors(filtered);
  };

  const updateVendorSSP = async (vendorId: string, isSSP: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_settlement_service_provider: isSSP } as any)
        .eq('user_id' as any, vendorId as any);

      if (error) throw error;

      setVendors(prev => prev.map(vendor =>
        vendor.user_id === vendorId ? { ...vendor, is_settlement_service_provider: isSSP } : vendor
      ));

      toast({
        title: "Success",
        description: `Vendor ${isSSP ? 'marked as' : 'removed from'} Settlement Service Provider`,
      });
    } catch (error) {
      console.error('Error updating vendor SSP status:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getVendorName = (vendor: Vendor) => {
    return vendor.business_name || vendor.display_name || 'Unnamed Vendor';
  };

  const getSSPBadge = (isSSP?: boolean) => {
    if (isSSP) {
      return <Badge variant="destructive">SSP - Limited Splits</Badge>;
    } else {
      return <Badge variant="outline">Non-SSP - No Split Limits</Badge>;
    }
  };

  const getStats = () => {
    const total = vendors.length;
    const ssps = vendors.filter(v => v.is_settlement_service_provider).length;
    const nonSSPs = total - ssps;
    
    return { total, ssps, nonSSPs };
  };

  const stats = getStats();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading vendors...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Settlement Service Provider (SSP) Management
        </CardTitle>
        <CardDescription>
          Mark vendors as Settlement Service Providers (SSPs) to apply RESPA split limits. Non-SSPs can pay 100% for agents.
        </CardDescription>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Vendors</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.ssps}</div>
            <div className="text-sm text-red-600">SSPs (Split Limited)</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.nonSSPs}</div>
            <div className="text-sm text-green-600">Non-SSPs (No Limits)</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vendors Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Settlement Service Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.user_id}>
                  <TableCell>
                    <div className="font-medium">{getVendorName(vendor)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vendor.specialties?.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {vendor.specialties && vendor.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{vendor.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSSPBadge(vendor.is_settlement_service_provider)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={vendor.is_settlement_service_provider === true}
                        onCheckedChange={(checked) => 
                          updateVendorSSP(vendor.user_id, checked)
                        }
                        disabled={saving}
                      />
                      <Label className="text-sm">
                        {vendor.is_settlement_service_provider ? 'SSP' : 'Non-SSP'}
                      </Label>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredVendors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No vendors found matching your criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorSSPManager;