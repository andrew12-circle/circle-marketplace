import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Coins, Clock, Users, TrendingUp } from 'lucide-react';

interface PointAllocation {
  id: string;
  agent_id: string;
  allocated_points: number;
  used_points: number;
  remaining_points: number;
  allocation_period: string;
  start_date: string;
  end_date: string;
  status: string;
  notes?: string;
  agent_name?: string;
  agent_email?: string;
}

interface AgentOption {
  id: string;
  display_name: string;
  email: string;
}

export function VendorPointsManager() {
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<PointAllocation[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState({
    agent_id: '',
    allocated_points: '',
    allocation_period: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadAllocations();
    loadAgents();
  }, []);

  const loadAllocations = async () => {
    try {
      // First get allocations
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('point_allocations')
        .select('*')
        .order('created_at', { ascending: false });

      if (allocationsError) throw allocationsError;

      // Then get agent profile info separately
      const agentIds = (allocationsData as any[])?.map((a: any) => a.agent_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id' as any, agentIds);

      if (profilesError) throw profilesError;

      const formattedAllocations = (allocationsData as any[])?.map((allocation: any) => {
        const profile = (profilesData as any[])?.find((p: any) => p.user_id === allocation.agent_id);
        
        return {
          ...allocation,
          agent_name: profile?.display_name || 'Unknown User',
          agent_email: 'Available in agent dashboard'
        };
      }) || [];

      setAllocations(formattedAllocations);
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast({
        title: "Error",
        description: "Failed to load point allocations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      // Get profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .not('display_name', 'is', null);

      if (profilesError) throw profilesError;

      setAgents((profilesData as any[])?.map((profile: any) => ({
        id: profile.user_id,
        display_name: profile.display_name || 'User',
        email: 'Available in profile'
      })) || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const generatePeriodOptions = () => {
    const currentYear = new Date().getFullYear();
    const periods = [];
    
    // Generate quarters for current and next year
    for (let year = currentYear; year <= currentYear + 1; year++) {
      for (let q = 1; q <= 4; q++) {
        periods.push(`Q${q}_${year}`);
      }
    }
    
    // Generate months for current and next year
    for (let year = currentYear; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        periods.push(`monthly_${year}_${monthStr}`);
      }
    }
    
    return periods;
  };

  const handleCreateAllocation = async () => {
    try {
      if (!formData.agent_id || !formData.allocated_points || !formData.allocation_period || !formData.start_date || !formData.end_date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('point_allocations')
        .insert({
          agent_id: formData.agent_id,
          vendor_id: (await supabase.auth.getUser()).data.user?.id,
          allocated_points: parseInt(formData.allocated_points),
          allocation_period: formData.allocation_period,
          start_date: formData.start_date,
          end_date: formData.end_date,
          notes: formData.notes,
          status: 'active'
        } as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Point allocation created successfully"
      });

      setShowCreateForm(false);
      setFormData({
        agent_id: '',
        allocated_points: '',
        allocation_period: '',
        start_date: '',
        end_date: '',
        notes: ''
      });
      loadAllocations();
    } catch (error: any) {
      console.error('Error creating allocation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create point allocation",
        variant: "destructive"
      });
    }
  };

  const toggleAllocationStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const { error } = await supabase
        .from('point_allocations')
        .update({ status: newStatus } as any)
        .eq('id' as any, id as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Allocation ${newStatus === 'active' ? 'activated' : 'suspended'}`
      });

      loadAllocations();
    } catch (error) {
      console.error('Error updating allocation:', error);
      toast({
        title: "Error",
        description: "Failed to update allocation status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading point allocations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendor Points Manager</h2>
          <p className="text-muted-foreground">Allocate co-pay points to agents</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Allocate Points
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-2xl font-bold">
                  {allocations.reduce((sum, a) => sum + a.allocated_points, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Points Used</p>
                <p className="text-2xl font-bold">
                  {allocations.reduce((sum, a) => sum + a.used_points, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Allocations</p>
                <p className="text-2xl font-bold">
                  {allocations.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">
                  {new Set(allocations.filter(a => a.status === 'active').map(a => a.agent_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Point Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agent">Agent</Label>
                <Select value={formData.agent_id} onValueChange={(value) => setFormData({ ...formData, agent_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.display_name} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="points">Points to Allocate</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.allocated_points}
                  onChange={(e) => setFormData({ ...formData, allocated_points: e.target.value })}
                  placeholder="e.g., 2000"
                />
              </div>

              <div>
                <Label htmlFor="period">Allocation Period</Label>
                <Select value={formData.allocation_period} onValueChange={(value) => setFormData({ ...formData, allocation_period: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {generatePeriodOptions().map((period) => (
                      <SelectItem key={period} value={period}>
                        {period.replace('_', ' ').replace('monthly', 'Month')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this allocation..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateAllocation}>Create Allocation</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Allocations</h3>
        {allocations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No point allocations found</p>
            </CardContent>
          </Card>
        ) : (
          allocations.map((allocation) => (
            <Card key={allocation.id} className={allocation.status !== 'active' ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{allocation.agent_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        allocation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {allocation.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{allocation.agent_email}</p>
                    <p className="text-sm"><strong>Period:</strong> {allocation.allocation_period}</p>
                    <p className="text-sm"><strong>Duration:</strong> {allocation.start_date} to {allocation.end_date}</p>
                    {allocation.notes && <p className="text-sm text-muted-foreground">{allocation.notes}</p>}
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Allocated</p>
                        <p className="font-bold text-blue-600">{allocation.allocated_points.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Used</p>
                        <p className="font-bold text-red-600">{allocation.used_points.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="font-bold text-green-600">{allocation.remaining_points.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={allocation.status === 'active'}
                        onCheckedChange={() => toggleAllocationStatus(allocation.id, allocation.status)}
                      />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}