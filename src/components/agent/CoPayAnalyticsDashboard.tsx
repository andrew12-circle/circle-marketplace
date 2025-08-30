// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, FileText, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const CoPayAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRequests: 0,
      approvedRequests: 0,
      totalSavings: 0,
      averageProcessingTime: 0,
      conversionRate: 0
    },
    monthlyData: [],
    categoryBreakdown: [],
    topVendors: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('last_30_days');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case 'last_7_days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'last_30_days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'last_90_days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case 'last_12_months':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch co-pay requests data
      const { data: requests, error } = await supabase
        .from('co_pay_requests')
        .select(`
          *,
          services(title, category, retail_price),
          vendors(name),
          agent_profile:profiles!co_pay_requests_agent_id_fkey(display_name)
        `)
        .eq('agent_id' as any, user.id as any)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process analytics data
      const processedAnalytics = processAnalyticsData(requests || []);
      setAnalytics(processedAnalytics);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (requests: any[]) => {
    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const totalSavings = requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => {
        const price = parseFloat(r.services?.retail_price?.replace(/[^0-9.]/g, '') || '0');
        return sum + (price * r.requested_split_percentage / 100);
      }, 0);

    // Calculate average processing time for approved/denied requests
    const processedRequests = requests.filter(r => r.status !== 'pending');
    const averageProcessingTime = processedRequests.length > 0
      ? processedRequests.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const updated = new Date(r.updated_at);
          return sum + (updated.getTime() - created.getTime());
        }, 0) / processedRequests.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    const conversionRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Monthly breakdown
    const monthlyData = generateMonthlyData(requests);

    // Category breakdown
    const categoryBreakdown = generateCategoryBreakdown(requests);

    // Top vendors
    const topVendors = generateTopVendors(requests);

    // Recent activity
    const recentActivity = requests.slice(0, 10).map(r => ({
      id: r.id,
      type: r.status,
      serviceName: r.services?.title || 'Unknown Service',
      vendorName: r.vendors?.name || 'Unknown Vendor',
      amount: parseFloat(r.services?.retail_price?.replace(/[^0-9.]/g, '') || '0') * r.requested_split_percentage / 100,
      date: r.updated_at,
      status: r.status
    }));

    return {
      overview: {
        totalRequests,
        approvedRequests,
        totalSavings,
        averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      monthlyData,
      categoryBreakdown,
      topVendors,
      recentActivity
    };
  };

  const generateMonthlyData = (requests: any[]) => {
    const monthlyMap = new Map();
    
    requests.forEach(request => {
      const month = new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, requests: 0, approved: 0, savings: 0 });
      }
      
      const data = monthlyMap.get(month);
      data.requests += 1;
      
      if (request.status === 'approved') {
        data.approved += 1;
        const price = parseFloat(request.services?.retail_price?.replace(/[^0-9.]/g, '') || '0');
        data.savings += price * request.requested_split_percentage / 100;
      }
    });

    return Array.from(monthlyMap.values()).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const generateCategoryBreakdown = (requests: any[]) => {
    const categoryMap = new Map();
    
    requests.filter(r => r.status === 'approved').forEach(request => {
      const category = request.services?.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { name: category, value: 0, count: 0 });
      }
      
      const data = categoryMap.get(category);
      data.count += 1;
      const price = parseFloat(request.services?.retail_price?.replace(/[^0-9.]/g, '') || '0');
      data.value += price * request.requested_split_percentage / 100;
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
  };

  const generateTopVendors = (requests: any[]) => {
    const vendorMap = new Map();
    
    requests.filter(r => r.status === 'approved').forEach(request => {
      const vendorName = request.vendors?.name || 'Unknown Vendor';
      if (!vendorMap.has(vendorName)) {
        vendorMap.set(vendorName, { name: vendorName, savings: 0, requests: 0 });
      }
      
      const data = vendorMap.get(vendorName);
      data.requests += 1;
      const price = parseFloat(request.services?.retail_price?.replace(/[^0-9.]/g, '') || '0');
      data.savings += price * request.requested_split_percentage / 100;
    });

    return Array.from(vendorMap.values()).sort((a, b) => b.savings - a.savings).slice(0, 5);
  };

  const exportData = () => {
    const csvData = analytics.recentActivity.map(activity => ({
      Date: new Date(activity.date).toLocaleDateString(),
      Service: activity.serviceName,
      Vendor: activity.vendorName,
      Status: activity.status,
      Amount: `$${activity.amount.toFixed(2)}`
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `copay-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Co-Pay Analytics</h2>
          <p className="text-gray-600">Track your savings and request patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="last_7_days">7D</TabsTrigger>
              <TabsTrigger value="last_30_days">30D</TabsTrigger>
              <TabsTrigger value="last_90_days">90D</TabsTrigger>
              <TabsTrigger value="last_12_months">12M</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalRequests}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{analytics.overview.approvedRequests}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">${analytics.overview.totalSavings.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.overview.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Process Time</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.overview.averageProcessingTime}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Total Requests" />
                <Line type="monotone" dataKey="approved" stroke="#82ca9d" name="Approved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Savings by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${typeof value === 'number' ? value.toFixed(2) : value}`, 'Savings']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topVendors.map((vendor, index) => (
                <div key={vendor.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-gray-600">{vendor.requests} requests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${vendor.savings.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">saved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'approved' ? 'bg-green-500' :
                      activity.status === 'declined' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{activity.serviceName}</p>
                      <p className="text-xs text-gray-600">{activity.vendorName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      activity.status === 'approved' ? 'default' :
                      activity.status === 'declined' ? 'destructive' : 'secondary'
                    }>
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};