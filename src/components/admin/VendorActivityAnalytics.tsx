import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VendorActivity {
  id: string;
  vendor_id: string;
  agent_id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
  vendors?: {
    name: string;
  };
  profiles?: {
    display_name: string;
  };
}

interface VendorAnalytics {
  vendor_id: string;
  vendor_name: string;
  total_agents: number;
  active_agents_30d: number;
  active_agents_90d: number;
  total_activities: number;
  activities_30d: number;
  consultation_bookings: number;
  service_saves: number;
  funnel_views: number;
  contact_requests: number;
  co_pay_requests: number;
  growth_rate: number;
}

export const VendorActivityAnalytics = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<VendorAnalytics[]>([]);
  const [recentActivities, setRecentActivities] = useState<VendorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
    fetchRecentActivities();
  }, [selectedTimeframe]);

  const fetchAnalytics = async () => {
    try {
      const timeframe = selectedTimeframe === '30d' ? 30 : 90;
      
      // Get vendor analytics with agent counts and activities
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select(`
          id,
          name,
          co_marketing_agents
        `);

      if (vendorError) throw vendorError;

      // Get activity counts for each vendor
      const analyticsPromises = vendorData.map(async (vendor) => {
        // Get total activities for this vendor
        const { count: totalActivitiesCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id);

        // Get recent activities (last 30 days)
        const { count: recentActivitiesCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .gte('created_at', new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString());

        // Get activity breakdown
        const { count: consultationBookingsCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('activity_type', 'consultation_booking');

        const { count: serviceSavesCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('activity_type', 'service_save');

        const { count: funnelViewsCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('activity_type', 'funnel_view');

        const { count: contactRequestsCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('activity_type', 'contact_request');

        const { count: coPayRequestsCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .eq('activity_type', 'co_pay_request');

        // Get unique agents for different timeframes
        const { data: activeAgents30d } = await supabase
          .from('vendor_agent_activities')
          .select('agent_id')
          .eq('vendor_id', vendor.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const { data: activeAgents90d } = await supabase
          .from('vendor_agent_activities')
          .select('agent_id')
          .eq('vendor_id', vendor.id)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

        const uniqueAgents30d = new Set(activeAgents30d?.map(a => a.agent_id) || []).size;
        const uniqueAgents90d = new Set(activeAgents90d?.map(a => a.agent_id) || []).size;

        // Calculate growth rate (30d vs previous 30d)
        const { count: previousPeriodActivitiesCount } = await supabase
          .from('vendor_agent_activities')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id)
          .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
          .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const currentCount = recentActivitiesCount || 0;
        const previousCount = previousPeriodActivitiesCount || 0;
        const growthRate = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;

        return {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          total_agents: vendor.co_marketing_agents || 0,
          active_agents_30d: uniqueAgents30d,
          active_agents_90d: uniqueAgents90d,
          total_activities: totalActivitiesCount || 0,
          activities_30d: recentActivitiesCount || 0,
          consultation_bookings: consultationBookingsCount || 0,
          service_saves: serviceSavesCount || 0,
          funnel_views: funnelViewsCount || 0,
          contact_requests: contactRequestsCount || 0,
          co_pay_requests: coPayRequestsCount || 0,
          growth_rate: growthRate
        };
      });

      const analyticsResults = await Promise.all(analyticsPromises);
      setAnalytics(analyticsResults.sort((a, b) => b.activities_30d - a.activities_30d));

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendor analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_agent_activities')
        .select(`
          id,
          vendor_id,
          agent_id,
          activity_type,
          activity_data,
          created_at,
          vendors (name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to match our interface
      const activitiesWithProfiles = data?.map(activity => ({
        ...activity,
        profiles: { display_name: 'Agent' }, // Simplified for now
        vendors: activity.vendors
      })) || [];
      
      setRecentActivities(activitiesWithProfiles);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'consultation_booking': return <Calendar className="w-4 h-4" />;
      case 'service_save': return <Heart className="w-4 h-4" />;
      case 'service_purchase': return <DollarSign className="w-4 h-4" />;
      case 'funnel_view': return <Eye className="w-4 h-4" />;
      case 'contact_request': return <MessageCircle className="w-4 h-4" />;
      case 'co_pay_request': return <TrendingUp className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityLabel = (activityType: string) => {
    switch (activityType) {
      case 'consultation_booking': return 'Consultation Booked';
      case 'service_save': return 'Service Saved';
      case 'service_purchase': return 'Service Purchased';
      case 'funnel_view': return 'Funnel Viewed';
      case 'contact_request': return 'Contact Request';
      case 'co_pay_request': return 'Co-Pay Request';
      default: return 'Activity';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return <p>Loading vendor analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Activity Analytics</h2>
          <p className="text-muted-foreground">Real-time tracking of agent engagement with vendors</p>
        </div>
        <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <TabsList>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendor-details">Vendor Details</TabsTrigger>
          <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Vendors</p>
                    <p className="text-2xl font-bold">{analytics.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Agents ({selectedTimeframe})</p>
                    <p className="text-2xl font-bold">
                      {analytics.reduce((sum, v) => sum + (selectedTimeframe === '30d' ? v.active_agents_30d : v.active_agents_90d), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Activities ({selectedTimeframe})</p>
                    <p className="text-2xl font-bold">
                      {analytics.reduce((sum, v) => sum + v.activities_30d, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Growth Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics.length > 0 ? 
                        `${(analytics.reduce((sum, v) => sum + v.growth_rate, 0) / analytics.length).toFixed(1)}%` : 
                        '0%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vendors (by Activity)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.slice(0, 10).map((vendor, index) => (
                  <div key={vendor.vendor_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{vendor.vendor_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vendor.active_agents_30d} active agents • {vendor.activities_30d} activities
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={vendor.growth_rate >= 0 ? "default" : "destructive"}>
                        {vendor.growth_rate >= 0 ? '+' : ''}{vendor.growth_rate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-details" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {analytics.map((vendor) => (
              <Card key={vendor.vendor_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{vendor.vendor_name}</CardTitle>
                    <Badge variant={vendor.growth_rate >= 0 ? "default" : "destructive"}>
                      {vendor.growth_rate >= 0 ? '+' : ''}{vendor.growth_rate.toFixed(1)}% growth
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Agents (30d)</p>
                      <p className="text-2xl font-bold">{vendor.active_agents_30d}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Activities</p>
                      <p className="text-2xl font-bold">{vendor.total_activities}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Consultations</p>
                      <p className="text-2xl font-bold">{vendor.consultation_bookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service Saves</p>
                      <p className="text-2xl font-bold">{vendor.service_saves}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Funnel Views</p>
                      <p className="text-xl font-semibold">{vendor.funnel_views}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Requests</p>
                      <p className="text-xl font-semibold">{vendor.contact_requests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Co-Pay Requests</p>
                      <p className="text-xl font-semibold">{vendor.co_pay_requests}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent-activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Agent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-muted">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {getActivityLabel(activity.activity_type)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Agent: {activity.profiles?.display_name || 'Unknown'} • 
                        Vendor: {activity.vendors?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};