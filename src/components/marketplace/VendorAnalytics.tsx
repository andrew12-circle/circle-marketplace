import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  Eye,
  Calendar,
  Users,
  DollarSign,
  Target,
  Clock,
  MapPin,
  Phone
} from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  consultationBookings: number;
  campaignSpend: number;
  recentViews: number;
  monthlyViews: number;
  conversionRate: number;
  partneredAgents: number;
  campaignsFunded: number;
}

interface VendorAnalyticsProps {
  data: AnalyticsData;
  vendorData: {
    name: string;
    location?: string;
    co_marketing_agents: number;
    campaigns_funded: number;
  };
}

export const VendorAnalytics = ({ data, vendorData }: VendorAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock trends data
  const trendsData = [
    { period: 'Last Week', views: 45, bookings: 3, growth: 12 },
    { period: 'This Week', views: 67, bookings: 5, growth: 15 },
    { period: 'Last Month', views: 180, bookings: 15, growth: 8 },
    { period: 'This Month', views: 220, bookings: 18, growth: 22 }
  ];

  const performanceMetrics = [
    { label: 'Profile Views', current: data.totalViews, target: 500, color: 'blue' },
    { label: 'Conversions', current: data.consultationBookings, target: 25, color: 'green' },
    { label: 'Response Rate', current: 85, target: 90, color: 'purple' },
    { label: 'Agent Satisfaction', current: 92, target: 95, color: 'orange' }
  ];

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProgressColor = (metric: any) => {
    const colors = {
      blue: 'bg-blue-600',
      green: 'bg-green-600', 
      purple: 'bg-purple-600',
      orange: 'bg-orange-600'
    };
    return colors[metric.color as keyof typeof colors] || 'bg-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your vendor performance and growth</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{data.recentViews} this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign ROI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2x</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +0.5x improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <TrendingDown className="w-3 h-3 mr-1" />
              +0.3h slower
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Performance Goals
          </CardTitle>
          <p className="text-sm text-gray-600">Track your progress towards monthly targets</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{metric.label}</span>
                  <span className="text-sm text-gray-600">
                    {metric.current} / {metric.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metric)}`}
                    style={{ width: `${Math.min((metric.current / metric.target) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round((metric.current / metric.target) * 100)}% of target
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance Trends
            </CardTitle>
            <p className="text-sm text-gray-600">{getTimeRangeLabel(timeRange)}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendsData.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{trend.period}</p>
                    <p className="text-sm text-gray-600">{trend.views} views • {trend.bookings} bookings</p>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-600">+{trend.growth}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Geographic Performance
            </CardTitle>
            <p className="text-sm text-gray-600">Performance by location</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { state: 'California', views: 145, conversions: 12, rate: 8.3 },
                { state: 'Texas', views: 98, conversions: 8, rate: 8.2 },
                { state: 'Florida', views: 87, conversions: 6, rate: 6.9 },
                { state: 'New York', views: 76, conversions: 5, rate: 6.6 },
                { state: 'Others', views: 156, conversions: 9, rate: 5.8 }
              ].map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">
                        {location.state.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{location.state}</p>
                      <p className="text-sm text-gray-600">{location.views} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{location.rate}%</p>
                    <p className="text-sm text-gray-600">{location.conversions} conversions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Campaign Performance
          </CardTitle>
          <p className="text-sm text-gray-600">Monthly campaign metrics and ROI</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Month</th>
                  <th className="text-left py-3 px-2">Spend</th>
                  <th className="text-left py-3 px-2">Leads</th>
                  <th className="text-left py-3 px-2">Conversions</th>
                  <th className="text-left py-3 px-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { month: 'January', spend: 1200, leads: 45, conversions: 8, roi: 2.8 },
                  { month: 'February', spend: 1800, leads: 67, conversions: 12, roi: 3.2 },
                  { month: 'March', spend: 1500, leads: 52, conversions: 9, roi: 2.9 },
                  { month: 'April', spend: 2200, leads: 78, conversions: 15, roi: 3.5 },
                  { month: 'May', spend: 1900, leads: 63, conversions: 11, roi: 3.1 },
                  { month: 'June', spend: 2500, leads: 89, conversions: 18, roi: 3.8 }
                ].map((campaign, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{campaign.month}</td>
                    <td className="py-3 px-2">{formatCurrency(campaign.spend)}</td>
                    <td className="py-3 px-2">{campaign.leads}</td>
                    <td className="py-3 px-2">{campaign.conversions}</td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {campaign.roi}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <p className="text-sm text-gray-600">AI-powered recommendations to improve your metrics</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900">Strong Conversion Rate</h4>
                  <p className="text-sm text-green-700">Your {data.conversionRate}% conversion rate is 23% above industry average.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Eye className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Increase Visibility</h4>
                  <p className="text-sm text-blue-700">Consider boosting campaigns in Texas and Florida for better reach.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-orange-900">Response Time</h4>
                  <p className="text-sm text-orange-700">Faster responses (under 2 hours) could improve conversion by 15%.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="w-3 h-3 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900">Contact Optimization</h4>
                  <p className="text-sm text-purple-700">Adding a direct phone number could increase consultation bookings.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};