import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, RotateCcw } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  co_marketing_agents: number;
  campaigns_funded: number;
}

export const VendorCoMarketingManager = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingVendor, setUpdatingVendor] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('id, name, co_marketing_agents, campaigns_funded')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(vendorData || []);
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

  const updateCoMarketingAgents = async (vendorId: string, newCount: number, notes?: string) => {
    setUpdatingVendor(vendorId);
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          co_marketing_agents: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) throw error;

      // Log the manual update
      await supabase
        .from('audit_log')
        .insert({
          table_name: 'vendors',
          operation: 'UPDATE',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          new_data: { 
            vendor_id: vendorId, 
            co_marketing_agents: newCount, 
            manual_update: true,
            notes: notes 
          }
        });

      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, co_marketing_agents: newCount }
          : vendor
      ));

      toast({
        title: "Success",
        description: "Co-marketing agents count updated successfully",
      });
    } catch (error) {
      console.error('Error updating co-marketing agents:', error);
      toast({
        title: "Error",
        description: "Failed to update co-marketing agents count",
        variant: "destructive",
      });
    } finally {
      setUpdatingVendor(null);
    }
  };

  const recalculateStats = async (vendorId: string) => {
    setUpdatingVendor(vendorId);
    
    try {
      // Call the database function to recalculate stats
      const { data, error } = await supabase
        .rpc('calculate_vendor_stats', { vendor_uuid: vendorId });

      if (error) throw error;

      // Update the vendor in the database with recalculated stats
      const coMarketingAgents = (data as any)?.co_marketing_agents || 0;
      const campaignsFunded = (data as any)?.campaigns_funded || 0;

      await supabase
        .from('vendors')
        .update({ 
          co_marketing_agents: coMarketingAgents,
          campaigns_funded: campaignsFunded,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId 
          ? { 
              ...vendor, 
              co_marketing_agents: coMarketingAgents,
              campaigns_funded: campaignsFunded
            }
          : vendor
      ));

      toast({
        title: "Success",
        description: "Vendor stats recalculated successfully",
      });
    } catch (error) {
      console.error('Error recalculating stats:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate vendor stats",
        variant: "destructive",
      });
    } finally {
      setUpdatingVendor(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading vendors...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Co-Marketing Agents Manager</h1>
        <p className="text-muted-foreground">
          Manage and update co-marketing agent counts for vendors
        </p>
      </div>

      <div className="grid gap-6">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            onUpdate={updateCoMarketingAgents}
            onRecalculate={recalculateStats}
            isUpdating={updatingVendor === vendor.id}
          />
        ))}
      </div>
    </div>
  );
};

interface VendorCardProps {
  vendor: Vendor;
  onUpdate: (vendorId: string, newCount: number, notes?: string) => void;
  onRecalculate: (vendorId: string) => void;
  isUpdating: boolean;
}

const VendorCard: React.FC<VendorCardProps> = ({ 
  vendor, 
  onUpdate, 
  onRecalculate, 
  isUpdating 
}) => {
  const [newCount, setNewCount] = useState(vendor.co_marketing_agents.toString());
  const [notes, setNotes] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const handleUpdate = () => {
    const count = parseInt(newCount);
    if (isNaN(count) || count < 0) {
      return;
    }
    
    onUpdate(vendor.id, count, notes);
    setShowUpdateForm(false);
    setNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{vendor.name}</span>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{vendor.co_marketing_agents} agents</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{vendor.campaigns_funded} campaigns</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRecalculate(vendor.id)}
              disabled={isUpdating}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Recalculate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              disabled={isUpdating}
            >
              Manual Update
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {showUpdateForm && (
        <CardContent className="border-t">
          <div className="space-y-4">
            <div>
              <Label htmlFor={`count-${vendor.id}`}>Co-Marketing Agents Count</Label>
              <Input
                id={`count-${vendor.id}`}
                type="number"
                min="0"
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                placeholder="Enter new count"
              />
            </div>
            <div>
              <Label htmlFor={`notes-${vendor.id}`}>Update Notes (Optional)</Label>
              <Textarea
                id={`notes-${vendor.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for manual update..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                size="sm"
              >
                {isUpdating ? 'Updating...' : 'Update Count'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpdateForm(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};