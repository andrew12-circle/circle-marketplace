import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, Calendar, Users, Gift, TrendingUp, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadStripe } from '@stripe/stripe-js';

interface Agent {
  user_id: string;
  display_name: string;
  email: string;
}

interface PointAllocation {
  id: string;
  agent_id: string;
  agent_name: string;
  allocated_points: number;
  used_points: number;
  remaining_points: number;
  allocation_period: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  stripe_payment_method_id?: string;
}

const VendorPointAllocationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allocations, setAllocations] = useState<PointAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [paymentMethodSetup, setPaymentMethodSetup] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    points: '',
    period: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    loadAgents();
    loadAllocations();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .neq('user_id', user?.id);

      if (error) throw error;

      // Get email from auth.users via function
      const agentsWithEmail = await Promise.all(
        data.map(async (agent) => {
          const { data: authData } = await supabase.auth.admin.getUserById(agent.user_id);
          return {
            user_id: agent.user_id,
            display_name: agent.display_name || 'Unknown User',
            email: authData.user?.email || 'No email'
          };
        })
      );

      setAgents(agentsWithEmail);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadAllocations = async () => {
    try {
      const { data, error } = await supabase
        .from('point_allocations')
        .select('*')
        .eq('vendor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get agent names separately
      const agentIds = [...new Set(data.map(allocation => allocation.agent_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', agentIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile.display_name;
        return acc;
      }, {} as Record<string, string>) || {};

      const formattedAllocations = data.map(allocation => ({
        ...allocation,
        agent_name: profileMap[allocation.agent_id] || 'Unknown Agent'
      }));

      setAllocations(formattedAllocations);
      
      // Check if vendor has payment method
      const hasPayment = formattedAllocations.some(allocation => allocation.stripe_payment_method_id);
      setHasPaymentMethod(hasPayment);
    } catch (error) {
      console.error('Error loading allocations:', error);
    }
  };

  const handleCreateAllocation = async () => {
    if (!selectedAgent || !allocationForm.points || !allocationForm.period || !allocationForm.startDate || !allocationForm.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('point_allocations')
        .insert({
          vendor_id: user?.id,
          agent_id: selectedAgent,
          allocated_points: parseInt(allocationForm.points),
          allocation_period: allocationForm.period,
          start_date: allocationForm.startDate,
          end_date: allocationForm.endDate,
          notes: allocationForm.notes,
          created_by: user?.id,
          charge_on_use: true
        });

      if (error) throw error;

      toast({
        title: "Points Allocated",
        description: `Successfully allocated ${allocationForm.points} points`,
      });

      // Reset form
      setAllocationForm({
        points: '',
        period: '',
        startDate: '',
        endDate: '',
        notes: ''
      });
      setSelectedAgent('');
      
      loadAllocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to allocate points",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupPaymentMethod = async () => {
    if (!user?.id) return;
    
    setPaymentMethodSetup(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('setup-vendor-payment', {
        body: { vendor_id: user.id }
      });

      if (error) throw error;

      const stripe = await loadStripe('pk_test_51JrJNnKtnBNtpCJ2qlGPzGPOIpGm9q0e8V3j9z0RzJvFnNgJJ5aY1sW3EQg9r1P7zI8v5mA0z2c4Z6sX8y0b1FqE00M8uC8QKR');
      if (!stripe) throw new Error('Failed to load Stripe');

      const { error: confirmError } = await stripe.confirmSetup({
        clientSecret: data.setup_intent_client_secret,
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (!confirmError) {
        toast({
          title: "Payment Method Added",
          description: "Your payment method has been saved successfully.",
        });
        loadAllocations();
      }
    } catch (error) {
      console.error('Payment setup error:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to setup payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentMethodSetup(false);
    }
  };

  const getQuickDateRange = (period: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    
    switch (period) {
      case `Q${quarter}_${year}`:
        const qStart = new Date(year, (quarter - 1) * 3, 1);
        const qEnd = new Date(year, quarter * 3, 0);
        return {
          start: qStart.toISOString().split('T')[0],
          end: qEnd.toISOString().split('T')[0]
        };
      case `monthly_${year}_${String(now.getMonth() + 1).padStart(2, '0')}`:
        const mStart = new Date(year, now.getMonth(), 1);
        const mEnd = new Date(year, now.getMonth() + 1, 0);
        return {
          start: mStart.toISOString().split('T')[0],
          end: mEnd.toISOString().split('T')[0]
        };
      default:
        return { start: '', end: '' };
    }
  };

  const handlePeriodChange = (period: string) => {
    setAllocationForm(prev => ({ ...prev, period }));
    const dateRange = getQuickDateRange(period);
    if (dateRange.start && dateRange.end) {
      setAllocationForm(prev => ({
        ...prev,
        startDate: dateRange.start,
        endDate: dateRange.end
      }));
    }
  };

  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocated_points, 0);
  const totalUsed = allocations.reduce((sum, alloc) => sum + alloc.used_points, 0);
  const totalRemaining = allocations.reduce((sum, alloc) => sum + alloc.remaining_points, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Point Allocations</h1>
            <p className="text-muted-foreground">Manage agent point allocations for co-pay assistance</p>
          </div>
        </div>
        {!hasPaymentMethod && (
          <Button 
            onClick={setupPaymentMethod}
            disabled={paymentMethodSetup}
            variant="outline"
            className="flex items-center gap-2"
          >
            {paymentMethodSetup ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
            Setup Payment Method
          </Button>
        )}
      </div>

      {!hasPaymentMethod && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Payment Method Required:</strong> You need to setup a payment method before allocating points. 
            You'll only be charged when agents actually use the points you allocate.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-2xl font-bold">{totalAllocated.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">${totalAllocated.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Points Used</p>
                <p className="text-2xl font-bold">{totalUsed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">${totalUsed.toLocaleString()} covered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">{totalRemaining.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">${totalRemaining.toLocaleString()} available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{allocations.filter(a => a.status === 'active').length}</p>
                <p className="text-xs text-muted-foreground">with allocations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Create Point Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Each point equals $1. Agents can use these points for automatic co-pay deductions when purchasing services.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.user_id} value={agent.user_id}>
                      {agent.display_name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Points to Allocate</Label>
              <Input
                type="number"
                placeholder="e.g., 2000"
                value={allocationForm.points}
                onChange={(e) => setAllocationForm(prev => ({ ...prev, points: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Value: ${parseInt(allocationForm.points || '0').toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Allocation Period</Label>
              <Select value={allocationForm.period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1_2024">Q1 2024</SelectItem>
                  <SelectItem value="Q2_2024">Q2 2024</SelectItem>
                  <SelectItem value="Q3_2024">Q3 2024</SelectItem>
                  <SelectItem value="Q4_2024">Q4 2024</SelectItem>
                  <SelectItem value="monthly_2024_01">January 2024</SelectItem>
                  <SelectItem value="monthly_2024_02">February 2024</SelectItem>
                  <SelectItem value="yearly_2024">Year 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Period (Optional)</Label>
              <Input
                placeholder="e.g., Q4_2024_Special"
                value={allocationForm.period}
                onChange={(e) => setAllocationForm(prev => ({ ...prev, period: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={allocationForm.startDate}
                onChange={(e) => setAllocationForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={allocationForm.endDate}
                onChange={(e) => setAllocationForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="e.g., Q4 co-marketing budget allocation"
              value={allocationForm.notes}
              onChange={(e) => setAllocationForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <Button onClick={handleCreateAllocation} disabled={loading || !hasPaymentMethod} className="w-full">
            {loading ? 'Creating...' : 'Allocate Points'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocations.map(allocation => (
              <div key={allocation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{allocation.agent_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      allocation.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {allocation.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {allocation.allocation_period}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Allocated</p>
                    <p className="font-medium">{allocation.allocated_points.toLocaleString()} pts</p>
                    <p className="text-xs text-muted-foreground">${allocation.allocated_points.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Used</p>
                    <p className="font-medium text-blue-600">{allocation.used_points.toLocaleString()} pts</p>
                    <p className="text-xs text-muted-foreground">${allocation.used_points.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-medium text-green-600">{allocation.remaining_points.toLocaleString()} pts</p>
                    <p className="text-xs text-muted-foreground">${allocation.remaining_points.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valid Until</p>
                    <p className="font-medium">{new Date(allocation.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {allocation.notes && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <strong>Notes:</strong> {allocation.notes}
                  </div>
                )}
              </div>
            ))}

            {allocations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No point allocations created yet</p>
                <p className="text-sm">Create your first allocation above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorPointAllocationPanel;
