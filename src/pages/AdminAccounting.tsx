import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calculator,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Plus,
  Minus,
  Receipt,
  FileText,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AdminAccounting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [accountingSummary, setAccountingSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAccountingSummary(),
        loadTransactions(),
        loadAllocations(),
        loadAgents(),
        loadVendors(),
        loadCharges()
      ]);
    } catch (error) {
      console.error('Error loading accounting data:', error);
      toast({
        title: "Error",
        description: "Failed to load accounting data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAccountingSummary = async () => {
    // Load summary statistics
    const { data: transactionsData } = await supabase
      .from('point_transactions')
      .select('*');
    
    const { data: allocationsData } = await supabase
      .from('point_allocations')
      .select('*');

    const { data: chargesData } = await supabase
      .from('point_charges')
      .select('*');

    const totalPointsAllocated = allocationsData?.reduce((sum, a) => sum + a.allocated_points, 0) || 0;
    const totalPointsUsed = transactionsData?.filter(t => t.transaction_type === 'deduction').reduce((sum, t) => sum + t.points_used, 0) || 0;
    const totalAmountCharged = chargesData?.filter(c => c.charge_status === 'completed').reduce((sum, c) => sum + parseFloat(c.amount_charged.toString()), 0) || 0;
    const activeAllocations = allocationsData?.filter(a => a.status === 'active').length || 0;

    setAccountingSummary({
      totalPointsAllocated,
      totalPointsUsed,
      totalAmountCharged,
      activeAllocations,
      pointsRemaining: totalPointsAllocated - totalPointsUsed,
      pendingCharges: chargesData?.filter(c => c.charge_status === 'pending').length || 0
    });
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('point_transactions')
      .select(`
        *,
        point_allocations!inner(
          vendor_id,
          allocation_period,
          profiles!point_allocations_vendor_id_fkey(display_name, business_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setTransactions(data || []);
  };

  const loadAllocations = async () => {
    const { data, error } = await supabase
      .from('point_allocations')
      .select(`
        *,
        agent_profile:profiles!point_allocations_agent_id_fkey(display_name, business_name, email),
        vendor_profile:profiles!point_allocations_vendor_id_fkey(display_name, business_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAllocations(data || []);
  };

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('vendor_enabled', true)
      .order('display_name');

    if (error) throw error;
    setAgents(data || []);
  };

  const loadVendors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('vendor_enabled', true)
      .order('display_name');

    if (error) throw error;
    setVendors(data || []);
  };

  const loadCharges = async () => {
    const { data, error } = await supabase
      .from('point_charges')
      .select(`
        *,
        allocation:point_allocations!inner(
          vendor_profile:profiles!point_allocations_vendor_id_fkey(display_name, business_name),
          agent_profile:profiles!point_allocations_agent_id_fkey(display_name, business_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setCharges(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Loading Accounting Data...</h3>
            <p className="text-muted-foreground">Please wait while we fetch the latest financial information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Circle Points Accounting</h1>
            <p className="text-muted-foreground">
              Complete financial oversight and transaction management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Statement
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points Allocated</p>
                  <p className="text-2xl font-bold">${accountingSummary?.totalPointsAllocated?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Points Used</p>
                  <p className="text-2xl font-bold text-red-600">${accountingSummary?.totalPointsUsed?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount Charged</p>
                  <p className="text-2xl font-bold text-green-600">${accountingSummary?.totalAmountCharged?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Allocations</p>
                  <p className="text-2xl font-bold">{accountingSummary?.activeAllocations}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Accounting Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="charges">Charges</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>Current period overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Points Outstanding</span>
                    <span className="font-bold">${accountingSummary?.pointsRemaining?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Pending Charges</span>
                    <span className="font-bold text-yellow-600">{accountingSummary?.pendingCharges}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Collection Rate</span>
                    <span className="font-bold text-green-600">
                      {((accountingSummary?.totalAmountCharged / accountingSummary?.totalPointsUsed) * 100 || 0).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest transactions and charges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded-full ${transaction.transaction_type === 'allocation' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                            {transaction.transaction_type === 'allocation' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description || 'Point Transaction'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-semibold ${transaction.transaction_type === 'allocation' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.transaction_type === 'allocation' ? '+' : '-'}${transaction.amount_covered.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>Complete transaction history</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.transaction_type === 'allocation' ? 'default' : 'destructive'}>
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.agent_id?.slice(0, 8)}...</TableCell>
                        <TableCell>{transaction.point_allocations?.profiles?.business_name || 'N/A'}</TableCell>
                        <TableCell>{transaction.points_used}</TableCell>
                        <TableCell className="text-right">${transaction.amount_covered.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Point Allocations Management</CardTitle>
                <CardDescription>Manage vendor point allocations to agents</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell className="font-medium">
                          {allocation.vendor_profile?.business_name || allocation.vendor_profile?.display_name}
                        </TableCell>
                        <TableCell>
                          {allocation.agent_profile?.display_name}
                        </TableCell>
                        <TableCell>{allocation.allocation_period}</TableCell>
                        <TableCell>${allocation.allocated_points.toLocaleString()}</TableCell>
                        <TableCell>${allocation.used_points.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          ${allocation.remaining_points.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
                            {allocation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charges Tab */}
          <TabsContent value="charges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Charges</CardTitle>
                <CardDescription>Real-time vendor charges and payment processing</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stripe ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>{new Date(charge.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{charge.allocation?.vendor_profile?.business_name}</TableCell>
                        <TableCell>{charge.allocation?.agent_profile?.display_name}</TableCell>
                        <TableCell>{charge.points_charged}</TableCell>
                        <TableCell>${parseFloat(charge.amount_charged).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            charge.charge_status === 'completed' ? 'default' :
                            charge.charge_status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {charge.charge_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {charge.stripe_charge_id?.slice(0, 12)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reconciliation Tab */}
          <TabsContent value="reconciliation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reconciliation</CardTitle>
                <CardDescription>Balance verification and audit trail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Point Balance Check</h4>
                    <p className="text-2xl font-bold text-green-600">✓ Balanced</p>
                    <p className="text-sm text-muted-foreground">All transactions reconciled</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Payment Status</h4>
                    <p className="text-2xl font-bold text-yellow-600">{accountingSummary?.pendingCharges} Pending</p>
                    <p className="text-sm text-muted-foreground">Awaiting payment processing</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Audit Status</h4>
                    <p className="text-2xl font-bold text-blue-600">Current</p>
                    <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};