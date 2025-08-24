import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, RotateCcw, Sprout, Calendar, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Vendor {
  id: string;
  name: string;
  co_marketing_agents: number;
  campaigns_funded: number;
  computed_co_marketing_agents: number;
  seeded_co_marketing_agents: number;
  seed_active: boolean;
  seed_expires_at: string | null;
  seed_notes: string | null;
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
        .select(`
          id, 
          name, 
          co_marketing_agents, 
          campaigns_funded,
          computed_co_marketing_agents,
          seeded_co_marketing_agents,
          seed_active,
          seed_expires_at,
          seed_notes
        `)
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
      const computedCoMarketingAgents = (data as any)?.computed_co_marketing_agents || 0;
      const campaignsFunded = (data as any)?.campaigns_funded || 0;

      await supabase
        .from('vendors')
        .update({ 
          computed_co_marketing_agents: computedCoMarketingAgents,
          campaigns_funded: campaignsFunded,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      // Reload vendors to get updated effective count
      await loadVendors();

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

  const updateSeed = async (vendorId: string, seedData: SeedData) => {
    setUpdatingVendor(vendorId);
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          seeded_co_marketing_agents: seedData.seeded_co_marketing_agents,
          seed_active: seedData.seed_active,
          seed_expires_at: seedData.seed_expires_at,
          seed_notes: seedData.seed_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) throw error;

      // Reload vendors to get updated effective count
      await loadVendors();

      toast({
        title: "Success",
        description: "Seed configuration updated successfully",
      });
    } catch (error) {
      console.error('Error updating seed:', error);
      toast({
        title: "Error",
        description: "Failed to update seed configuration",
        variant: "destructive",
      });
    } finally {
      setUpdatingVendor(null);
    }
  };

  const clearSeed = async (vendorId: string) => {
    setUpdatingVendor(vendorId);
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          seeded_co_marketing_agents: 0,
          seed_active: false,
          seed_expires_at: null,
          seed_notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) throw error;

      // Reload vendors to get updated effective count
      await loadVendors();

      toast({
        title: "Success",
        description: "Seed configuration cleared successfully",
      });
    } catch (error) {
      console.error('Error clearing seed:', error);
      toast({
        title: "Error",
        description: "Failed to clear seed configuration",
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
            onUpdateSeed={updateSeed}
            onClearSeed={clearSeed}
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
  onUpdateSeed: (vendorId: string, seedData: SeedData) => void;
  onClearSeed: (vendorId: string) => void;
}

interface SeedData {
  seeded_co_marketing_agents: number;
  seed_active: boolean;
  seed_expires_at: string | null;
  seed_notes: string;
}

const VendorCard: React.FC<VendorCardProps> = ({ 
  vendor, 
  onUpdate, 
  onRecalculate, 
  isUpdating,
  onUpdateSeed,
  onClearSeed
}) => {
  const [newCount, setNewCount] = useState(vendor.co_marketing_agents.toString());
  const [notes, setNotes] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showSeedForm, setShowSeedForm] = useState(false);
  
  // Seed form state
  const [seedCount, setSeedCount] = useState(vendor.seeded_co_marketing_agents.toString());
  const [seedActive, setSeedActive] = useState(vendor.seed_active);
  const [seedExpires, setSeedExpires] = useState(vendor.seed_expires_at ? vendor.seed_expires_at.split('T')[0] : '');
  const [seedNotes, setSeedNotes] = useState(vendor.seed_notes || '');

  const handleUpdate = () => {
    const count = parseInt(newCount);
    if (isNaN(count) || count < 0) {
      return;
    }
    
    onUpdate(vendor.id, count, notes);
    setShowUpdateForm(false);
    setNotes('');
  };

  const handleSeedUpdate = () => {
    const count = parseInt(seedCount);
    if (isNaN(count) || count < 0) {
      return;
    }
    
    const seedData: SeedData = {
      seeded_co_marketing_agents: count,
      seed_active: seedActive,
      seed_expires_at: seedExpires ? `${seedExpires}T23:59:59Z` : null,
      seed_notes: seedNotes
    };
    
    onUpdateSeed(vendor.id, seedData);
    setShowSeedForm(false);
  };

  const isSeeded = vendor.seed_active && 
    (vendor.seed_expires_at === null || new Date(vendor.seed_expires_at) > new Date()) &&
    vendor.computed_co_marketing_agents === 0;

  const isExpired = vendor.seed_expires_at && new Date(vendor.seed_expires_at) < new Date();

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
                {isSeeded && (
                  <Badge variant="secondary" className="ml-1">
                    <Sprout className="h-3 w-3 mr-1" />
                    Seeded
                  </Badge>
                )}
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
              onClick={() => setShowSeedForm(!showSeedForm)}
              disabled={isUpdating}
            >
              <Sprout className="h-4 w-4 mr-1" />
              Manage Seed
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

      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{vendor.co_marketing_agents}</div>
            <div className="text-xs text-muted-foreground">Effective Count</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{vendor.computed_co_marketing_agents}</div>
            <div className="text-xs text-muted-foreground">Automatic Count</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{vendor.seeded_co_marketing_agents}</div>
            <div className="text-xs text-muted-foreground">
              Seeded Count
              {vendor.seed_active && (
                <Badge variant={isExpired ? "destructive" : "default"} className="ml-1">
                  {isExpired ? "Expired" : "Active"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {vendor.seed_notes && (
          <div className="bg-muted p-2 rounded text-sm mb-4">
            <strong>Seed Notes:</strong> {vendor.seed_notes}
          </div>
        )}

        {isExpired && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded mb-4">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Seed has expired and is no longer active</span>
          </div>
        )}
      </CardContent>

      {showSeedForm && (
        <CardContent className="border-t">
          <div className="space-y-4">
            <h3 className="font-semibold">Seed Configuration</h3>
            <div>
              <Label htmlFor={`seed-count-${vendor.id}`}>Seeded Agent Count</Label>
              <Input
                id={`seed-count-${vendor.id}`}
                type="number"
                min="0"
                value={seedCount}
                onChange={(e) => setSeedCount(e.target.value)}
                placeholder="Enter seed count"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id={`seed-active-${vendor.id}`}
                checked={seedActive}
                onCheckedChange={setSeedActive}
              />
              <Label htmlFor={`seed-active-${vendor.id}`}>Seed Active</Label>
            </div>
            <div>
              <Label htmlFor={`seed-expires-${vendor.id}`}>Expiration Date (Optional)</Label>
              <Input
                id={`seed-expires-${vendor.id}`}
                type="date"
                value={seedExpires}
                onChange={(e) => setSeedExpires(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`seed-notes-${vendor.id}`}>Seed Notes</Label>
              <Textarea
                id={`seed-notes-${vendor.id}`}
                value={seedNotes}
                onChange={(e) => setSeedNotes(e.target.value)}
                placeholder="Why is this count being seeded?"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSeedUpdate}
                disabled={isUpdating}
                size="sm"
              >
                {isUpdating ? 'Updating...' : 'Save Seed'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onClearSeed(vendor.id)}
                disabled={isUpdating}
                size="sm"
              >
                Clear Seed
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSeedForm(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      {showUpdateForm && (
        <CardContent className="border-t">
          <div className="space-y-4">
            <h3 className="font-semibold">Manual Override</h3>
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