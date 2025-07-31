import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, Save, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Vendor {
  id: string;
  name: string;
  sort_order?: number;
  location?: string;
}

export const VendorSortOrderManager = () => {
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
        .select('id, name, sort_order, location')
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

  const updateVendorSortOrder = async (vendorId: string, sortOrder: number) => {
    setUpdating(prev => ({ ...prev, [vendorId]: true }));
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ sort_order: sortOrder })
        .eq('id', vendorId);

      if (error) throw error;

      // Update local state
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, sort_order: sortOrder }
          : vendor
      ).sort((a, b) => (a.sort_order || 50) - (b.sort_order || 50)));

      toast({
        title: 'Success',
        description: 'Sort order updated successfully',
      });
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sort order',
        variant: 'destructive',
      });
    } finally {
      setUpdating(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleSortOrderUpdate = (vendorId: string) => {
    const input = document.getElementById(`sort-${vendorId}`) as HTMLInputElement;
    const sortOrder = input?.value ? parseInt(input.value) : 50;

    if (sortOrder < 1 || sortOrder > 100) {
      toast({
        title: 'Invalid Range',
        description: 'Sort order must be between 1 and 100',
        variant: 'destructive',
      });
      return;
    }

    updateVendorSortOrder(vendorId, sortOrder);
  };

  if (loading) {
    return <p>Loading vendors...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Vendor Sort Order Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control vendor display order (1-100). Lower numbers appear first. Current default is 50.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Quick Setup:</strong> Set Circle Home Loans to 1 for first position, other high-priority vendors to 2-10, standard vendors to 50.
            </p>
          </div>
          
          {vendors.map((vendor, index) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{vendor.name}</h3>
                  {vendor.location && (
                    <Badge variant="outline" className="text-xs">
                      {vendor.location}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Current Sort Order: {vendor.sort_order || 50}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap">Sort Order:</label>
                  <Input
                    id={`sort-${vendor.id}`}
                    type="number"
                    placeholder="50"
                    defaultValue={vendor.sort_order || 50}
                    className="w-20"
                    min="1"
                    max="100"
                  />
                </div>

                <Button
                  onClick={() => handleSortOrderUpdate(vendor.id)}
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