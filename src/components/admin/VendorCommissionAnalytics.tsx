import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, TrendingUp, Users, DollarSign, BarChart3, RefreshCw, Calendar, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClickData {
  id: string;
  service_id: string;
  destination_url: string;
  vendor_name: string;
  user_id: string;
  agent_name: string;
  created_at: string;
  commission_rate: number;
  agent_location: string;
  ip_address: string;
}

interface CommissionTracking {
  id: string;
  vendor_id: string;
  report_month: string;
  total_clicks: number;
  unique_agents: number;
  commission_rate: number;
  estimated_commission: number;
  actual_commission: number;
  commission_paid: boolean;
  report_sent_at: string;
  notes: string;
}

export function VendorCommissionAnalytics() {
  const { toast } = useToast();
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalEstimatedRevenue, setTotalEstimatedRevenue] = useState(0);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Load recent clicks
      const { data: clicks, error: clicksError } = await supabase
        .from('outbound_clicks')
        .select(`
          id,
          service_id,
          destination_url,
          user_id,
          created_at,
          ip_address,
          metadata,
          profiles!user_id (
            display_name,
            city,
            state
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (clicksError) throw clicksError;

      // Transform click data - simplified for now since we don't have the exact structure
      const transformedClicks = clicks?.map(click => ({
        id: click.id,
        service_id: click.service_id || '',
        destination_url: click.destination_url || '',
        vendor_name: 'External Vendor', // Will be populated when we have click tracking data
        user_id: click.user_id || '',
        agent_name: 'Agent', // Will be populated when we have profile relationships
        created_at: click.created_at,
        commission_rate: 5, // Default commission rate
        agent_location: 'Unknown',
        ip_address: click.ip_address?.toString() || ''
      })) || [];

      setClickData(transformedClicks);

      // Load commission tracking data
      const { data: commissions, error: commissionsError } = await supabase
        .from('vendor_commission_tracking')
        .select('*')
        .order('total_clicks', { ascending: false });

      if (commissionsError) throw commissionsError;
      // Calculate totals
      const clicks30Days = transformedClicks.length;
      const estimatedRevenue = transformedClicks.reduce((sum, click) => {
        // Rough estimate: $50 average service value * commission rate
        return sum + (50 * (click.commission_rate / 100));
      }, 0);

      setCommissionData(commissions || []);

      setTotalClicks(clicks30Days);
      setTotalEstimatedRevenue(estimatedRevenue);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendor analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMonthlyReports = async () => {
    try {
      toast({
        title: 'Sending Reports',
        description: 'Monthly reports are being generated and sent...',
      });

      const { data, error } = await supabase.functions.invoke('send-vendor-reports');

      if (error) throw error;

      toast({
        title: 'Reports Sent',
        description: `Monthly reports sent to ${data?.reportsSent || 0} vendors`,
      });

      // Refresh data
      loadAnalyticsData();
    } catch (error) {
      console.error('Error sending reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to send monthly reports',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Commission Analytics</h2>
          <p className="text-muted-foreground">Track external service clicks and commission reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSendMonthlyReports} size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Send Monthly Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Reports</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionData.length}</div>
            <p className="text-xs text-muted-foreground">Total reports sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Commission Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEstimatedRevenue)}</div>
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commissionData.length > 0 
                ? `${(commissionData.reduce((sum, c) => sum + c.commission_rate, 0) / commissionData.length).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Across all reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Commission Reports
          </CardTitle>
          <CardDescription>
            Commission tracking reports sent to external vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : commissionData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No commission reports found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Month</TableHead>
                  <TableHead>Total Clicks</TableHead>
                  <TableHead>Unique Agents</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Est. Commission</TableHead>
                  <TableHead>Report Sent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionData.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.report_month}</TableCell>
                    <TableCell>{report.total_clicks}</TableCell>
                    <TableCell>{report.unique_agents}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {report.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(report.estimated_commission)}</TableCell>
                    <TableCell>
                      {report.report_sent_at 
                        ? formatDate(report.report_sent_at)
                        : 'Not sent'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.commission_paid ? 'default' : 'outline'}>
                        {report.commission_paid ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Clicks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Recent Service Clicks
          </CardTitle>
          <CardDescription>
            Latest outbound clicks to external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : clickData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clicks recorded in the selected time period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clickData.map((click) => (
                  <TableRow key={click.id}>
                    <TableCell>
                      <div className="max-w-48 truncate font-medium">
                        {click.destination_url}
                      </div>
                    </TableCell>
                    <TableCell>{click.vendor_name}</TableCell>
                    <TableCell>{click.agent_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {click.agent_location || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {click.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(click.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}