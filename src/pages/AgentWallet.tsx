import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Wallet, 
  TrendingUp, 
  Award, 
  Target, 
  History, 
  Plus, 
  Crown,
  Coins,
  Eye,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ArrowLeft,
  CreditCard,
  Receipt,
  Filter,
  TrendingDown,
  Building2,
  CheckCircle,
  XCircle,
  Minus,
  DollarSign,
  BarChart3
} from "lucide-react";
import { AgentCoPayDashboard } from '@/components/agent/AgentCoPayDashboard';
import { CoPayAnalyticsDashboard } from '@/components/agent/CoPayAnalyticsDashboard';

export const AgentWallet = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [pointsData, setPointsData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullAccountNumber, setShowFullAccountNumber] = useState(false);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        loadPointsData(),
        loadTransactions(),
        loadAllocations()
      ]);
    }
  }, [user?.id]);

  const loadPointsData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_agent_points_summary', {
        p_agent_id: user?.id
      });

      if (error) throw error;
      setPointsData(data);
    } catch (error) {
      console.error('Error loading points data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('point_transactions')
        .select(`
          *,
          point_allocations!inner(
            vendor_id,
            allocation_period
          )
        `)
        .eq('agent_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadAllocations = async () => {
    try {
      const { data, error } = await supabase
        .from('point_allocations')
        .select(`
          *,
          profiles!point_allocations_vendor_id_fkey(
            display_name,
            business_name
          )
        `)
        .eq('agent_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllocations(data || []);
    } catch (error) {
      console.error('Error loading allocations:', error);
    }
  };

  // Calculate wallet statistics from real data
  const totalUsed = transactions.reduce((sum, t) => t.transaction_type === 'deduction' ? sum + t.points_used : sum, 0);
  const totalEarned = allocations.reduce((sum, a) => sum + a.allocated_points, 0);
  const pendingPoints = allocations.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.remaining_points, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthSpent = transactions
    .filter(t => t.created_at.startsWith(thisMonth) && t.transaction_type === 'deduction')
    .reduce((sum, t) => sum + t.points_used, 0);

  const availablePoints = pointsData?.total_available_points || 0;
  
  const walletData = {
    availablePoints,
    pendingPoints,
    totalEarned,
    thisMonthSpent,
    totalUsed,
    tier: totalEarned > 5000 ? "Platinum" : totalEarned > 2000 ? "Gold" : totalEarned > 500 ? "Silver" : "Bronze",
    nextTierPoints: totalEarned > 5000 ? 0 : totalEarned > 2000 ? 5000 - totalEarned : totalEarned > 500 ? 2000 - totalEarned : 500 - totalEarned,
    goal: {
      name: "Marketing Campaign",
      target: 1000,
      saved: Math.min(availablePoints, 650),
      progress: Math.min(100, (availablePoints / 1000) * 100)
    }
  };

  const pointsSummary = [
    {
      title: "Available Balance",
      value: walletData.availablePoints,
      icon: CreditCard,
      description: "Ready to spend",
      color: "text-emerald-600",
      formatted: `$${walletData.availablePoints.toLocaleString()}`
    },
    {
      title: "Pending",
      value: walletData.pendingPoints,
      icon: Clock,
      description: "Processing",
      color: "text-amber-600",
      formatted: `$${walletData.pendingPoints.toLocaleString()}`
    },
    {
      title: "Total Received",
      value: walletData.totalEarned,
      icon: TrendingUp,
      description: "All time earnings",
      color: "text-blue-600",
      formatted: `$${walletData.totalEarned.toLocaleString()}`
    },
    {
      title: "Total Spent",
      value: walletData.totalUsed,
      icon: TrendingDown,
      description: "All time spending",
      color: "text-red-600",
      formatted: `$${walletData.totalUsed.toLocaleString()}`
    }
  ];

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Premium Banking Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button asChild variant="secondary" size="sm" className="self-start bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Link to="/" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Link>
              </Button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Wallet className="h-8 w-8" />
                  <h1 className="text-2xl sm:text-3xl font-bold">Circle Wallet</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-white/80 text-sm sm:text-base">
                    Your co-pay points • Account Number: {showFullAccountNumber ? user?.id : `****${user?.id?.slice(-4)}`}
                  </p>
                  <button
                    onClick={() => setShowFullAccountNumber(!showFullAccountNumber)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Crown className="h-4 w-4 text-yellow-400 mr-1" />
                {walletData.tier} Member
              </Badge>
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Download className="h-4 w-4 mr-2" />
                Statement
              </Button>
            </div>
          </div>
          
          {/* Account Balance Display */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-white/60 text-sm">Available Balance</p>
              <p className="text-2xl font-bold">${walletData.availablePoints.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Account Status</p>
              <p className="text-lg font-semibold text-green-400">Active</p>
            </div>
            <div className="hidden lg:block">
              <p className="text-white/60 text-sm">Member Since</p>
              <p className="text-lg font-semibold">{profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}</p>
            </div>
            <div className="hidden lg:block">
              <p className="text-white/60 text-sm">Next Tier</p>
              <p className="text-lg font-semibold">{walletData.nextTierPoints > 0 ? `$${walletData.nextTierPoints}` : 'Max Level'}</p>
            </div>
          </div>
        </div>

        {/* Account Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {pointsSummary.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`inline-flex p-2 rounded-lg mb-3 ${item.color.includes('emerald') ? 'bg-emerald-100 dark:bg-emerald-900/20' : 
                      item.color.includes('amber') ? 'bg-amber-100 dark:bg-amber-900/20' :
                      item.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      {item.title}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {item.formatted}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Banking Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7 sm:grid-cols-4 grid-cols-2 h-auto lg:h-12 gap-1 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="overview" className="text-xs lg:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm flex-col lg:flex-row p-2 lg:p-3 h-auto lg:h-auto">
              <Receipt className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 mb-1 lg:mb-0" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Over</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs lg:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm flex-col lg:flex-row p-2 lg:p-3 h-auto lg:h-auto">
              <History className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 mb-1 lg:mb-0" />
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden">Trans</span>
            </TabsTrigger>
            <TabsTrigger value="allocations" className="text-xs lg:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm flex-col lg:flex-row p-2 lg:p-3 h-auto lg:h-auto">
              <Building2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 mb-1 lg:mb-0" />
              <span className="hidden sm:inline">Vendors</span>
              <span className="sm:hidden">Vend</span>
            </TabsTrigger>
            <TabsTrigger value="copay" className="text-xs lg:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm flex-col lg:flex-row p-2 lg:p-3 h-auto lg:h-auto">
              <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 mb-1 lg:mb-0" />
              <span className="hidden sm:inline">Co-Pay</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs lg:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm flex-col lg:flex-row p-2 lg:p-3 h-auto lg:h-auto sm:col-start-1 lg:col-start-auto">
              <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 mb-1 lg:mb-0" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Chart</span>
            </TabsTrigger>
            <TabsTrigger value="earn" className="text-xs lg:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm flex-col lg:flex-row p-2 lg:p-3 h-auto lg:h-auto">
              <Plus className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 mb-1 lg:mb-0" />
              <span className="hidden sm:inline">Earn</span>
              <span className="sm:hidden">+</span>
            </TabsTrigger>
            <TabsTrigger value="spend" className="text-xs lg:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm flex-col lg:flex-row p-2 lg:p-3 h-auto lg:h-auto">
              <Wallet className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 mb-1 lg:mb-0" />
              <span className="hidden sm:inline">Spend</span>
              <span className="sm:hidden">$</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Request Points from Vendor
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Statement
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Activity
                  </Button>
                </CardContent>
              </Card>

              {/* Account Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Account Activity Summary</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <p className="text-2xl font-bold text-emerald-600">${transactions.filter(t => t.transaction_type === 'allocation').reduce((sum, t) => sum + t.amount_covered, 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Points Received</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-2xl font-bold text-red-600">${transactions.filter(t => t.transaction_type === 'deduction').reduce((sum, t) => sum + t.amount_covered, 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Points Used</p>
                    </div>
                  </div>
                  
                  {/* Recent Transactions Preview */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Recent Transactions</h4>
                    {transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded-full ${transaction.transaction_type === 'allocation' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                            {transaction.transaction_type === 'allocation' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description || (transaction.transaction_type === 'allocation' ? 'Points Allocated' : 'Co-pay Purchase')}</p>
                            <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-sm ${transaction.transaction_type === 'allocation' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.transaction_type === 'allocation' ? '+' : '-'}${transaction.amount_covered.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Vendor Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Active Vendor Relationships</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allocations.filter(a => a.status === 'active').map((allocation) => (
                    <div key={allocation.id} className="p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{allocation.profiles?.business_name || allocation.profiles?.display_name}</h4>
                          <p className="text-sm text-muted-foreground">{allocation.allocation_period}</p>
                        </div>
                        <Badge variant={allocation.remaining_points > 0 ? "default" : "secondary"}>
                          {allocation.remaining_points > 0 ? "Active" : "Depleted"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Available:</span>
                          <span className="font-semibold text-green-600">${allocation.remaining_points.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Used:</span>
                          <span className="font-semibold">${allocation.used_points.toLocaleString()}</span>
                        </div>
                        <Progress value={(allocation.used_points / allocation.allocated_points) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
                {allocations.filter(a => a.status === 'active').length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Vendor Relationships</h3>
                    <p className="text-muted-foreground">Connect with vendors to receive co-pay point allocations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Full Transaction History */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Complete record of all point transactions</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded-full ${transaction.transaction_type === 'allocation' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                                {transaction.transaction_type === 'allocation' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              </div>
                              <span className="capitalize">{transaction.transaction_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{transaction.description || (transaction.transaction_type === 'allocation' ? 'Points Allocated' : 'Co-pay Purchase')}</TableCell>
                          <TableCell>{transaction.point_allocations?.allocation_period || 'N/A'}</TableCell>
                          <TableCell className={`text-right font-semibold ${transaction.transaction_type === 'allocation' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.transaction_type === 'allocation' ? '+' : '-'}${transaction.amount_covered.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground">Your transaction history will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendor Allocations Detail */}
          <TabsContent value="allocations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Vendor Point Allocations</span>
                </CardTitle>
                <CardDescription>
                  Detailed view of all point allocations from vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allocations.length > 0 ? (
                  <div className="space-y-4">
                    {allocations.map((allocation) => (
                      <Card key={allocation.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{allocation.profiles?.business_name || allocation.profiles?.display_name}</h3>
                              <p className="text-muted-foreground">{allocation.allocation_period}</p>
                            </div>
                            <Badge variant={allocation.status === 'active' ? 'default' : allocation.status === 'suspended' ? 'destructive' : 'secondary'}>
                              {allocation.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Allocated</p>
                              <p className="text-xl font-bold">${allocation.allocated_points.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Used</p>
                              <p className="text-xl font-bold text-red-600">${allocation.used_points.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Remaining</p>
                              <p className="text-xl font-bold text-green-600">${allocation.remaining_points.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Expires</p>
                              <p className="text-lg font-semibold">{new Date(allocation.end_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <Progress value={(allocation.used_points / allocation.allocated_points) * 100} className="mb-4" />
                          
                          {allocation.notes && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-sm"><strong>Notes:</strong> {allocation.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Vendor Allocations</h3>
                    <p className="text-muted-foreground">Ask vendors to allocate co-pay points for you</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earn Points Tab */}
          <TabsContent value="earn" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Refer Agents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Earn 100 points for each successful referral
                  </p>
                  <Button className="w-full">Start Referring</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Vendor Partnerships</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Partner with vendors and earn ongoing points
                  </p>
                  <Button className="w-full" variant="outline">Explore Partners</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Daily Check-ins</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Login daily to earn bonus points
                  </p>
                  <Button className="w-full" variant="outline">Check In</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Co-Pay Tab */}
          <TabsContent value="copay" className="space-y-6">
            <AgentCoPayDashboard />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <CoPayAnalyticsDashboard />
          </TabsContent>

          {/* Spend Points Tab */}
          <TabsContent value="spend" className="space-y-6">
            <div className="text-center py-8">
              <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Marketplace Integration</h3>
              <p className="text-muted-foreground mb-6">
                Use your points in the marketplace to purchase services and products
              </p>
              <Button size="lg">
                Go to Marketplace
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Complete history of your point transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                   {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                      <div className="flex items-center space-x-4">
                         <div className={`p-2 rounded-full ${
                           transaction.transaction_type === 'allocation' 
                             ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                             : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                         }`}>
                           {transaction.transaction_type === 'allocation' ? (
                             <ArrowUpRight className="h-4 w-4" />
                           ) : (
                             <ArrowDownLeft className="h-4 w-4" />
                           )}
                        </div>
                         <div>
                           <p className="font-medium">{transaction.description || (transaction.transaction_type === 'allocation' ? 'Points Allocated' : 'Co-pay Purchase')}</p>
                           <p className="text-sm text-muted-foreground">{new Date(transaction.created_at).toLocaleDateString()}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className={`font-semibold ${
                           transaction.transaction_type === 'allocation' ? 'text-green-600' : 'text-red-600'
                         }`}>
                           {transaction.transaction_type === 'allocation' ? '+' : '-'}${transaction.amount_covered.toLocaleString()}
                         </p>
                         <Badge 
                           variant="default"
                           className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20"
                         >
                           Completed
                         </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};