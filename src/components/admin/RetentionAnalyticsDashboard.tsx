import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingDown, 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";

interface RetentionEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  created_at: string;
}

interface RetentionMetrics {
  totalCancellations: number;
  cancellationReasons: Record<string, number>;
  monthlyChurnRate: number;
  avgSubscriptionLength: number;
  reactivations: number;
}

export const RetentionAnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null);
  const [events, setEvents] = useState<RetentionEvent[]>([]);
  const [timeframe, setTimeframe] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRetentionData = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);

      // Fetch retention events
      const { data: eventsData, error: eventsError } = await supabase
        .from('retention_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Calculate metrics
      const cancellations = eventsData?.filter(e => e.event_type === 'subscription_canceled') || [];
      const reasons: Record<string, number> = {};
      
      cancellations.forEach(event => {
        const eventData = event.event_data as any;
        const reason = eventData?.cancellation_reason || 'not_specified';
        reasons[reason] = (reasons[reason] || 0) + 1;
      });

      const calculatedMetrics: RetentionMetrics = {
        totalCancellations: cancellations.length,
        cancellationReasons: reasons,
        monthlyChurnRate: (cancellations.length / 30) * 100, // Simplified calculation
        avgSubscriptionLength: 6.2, // Mock data - would need more complex calculation
        reactivations: eventsData?.filter(e => e.event_type === 'subscription_resumed').length || 0
      };

      setMetrics(calculatedMetrics);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching retention data:', error);
      toast({
        title: "Error",
        description: "Failed to load retention analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRetentionData();
  }, [timeframe]);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'too_expensive': 'Too Expensive',
      'not_using': 'Not Using Enough',
      'found_alternative': 'Found Alternative',
      'missing_features': 'Missing Features',
      'technical_issues': 'Technical Issues',
      'other': 'Other',
      'not_specified': 'Not Specified'
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'too_expensive': 'bg-red-100 text-red-800',
      'not_using': 'bg-yellow-100 text-yellow-800',
      'found_alternative': 'bg-purple-100 text-purple-800',
      'missing_features': 'bg-blue-100 text-blue-800',
      'technical_issues': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800',
      'not_specified': 'bg-gray-100 text-gray-800'
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Retention Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRetentionData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cancellations</p>
                <p className="text-2xl font-bold">{metrics.totalCancellations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Reactivations</p>
                <p className="text-2xl font-bold">{metrics.reactivations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{metrics.monthlyChurnRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Length</p>
                <p className="text-2xl font-bold">{metrics.avgSubscriptionLength} mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reasons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reasons">Cancellation Reasons</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
        </TabsList>

        <TabsContent value="reasons">
          <Card>
            <CardHeader>
              <CardTitle>Cancellation Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.cancellationReasons).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No cancellation data for selected timeframe
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(metrics.cancellationReasons)
                    .sort(([,a], [,b]) => b - a)
                    .map(([reason, count]) => (
                      <div key={reason} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getReasonColor(reason)}>
                            {getReasonLabel(reason)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {((count / metrics.totalCancellations) * 100).toFixed(1)}%
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No events for selected timeframe
                </p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 20).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {event.event_type === 'subscription_canceled' && (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        {event.event_type === 'subscription_resumed' && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {event.event_type === 'subscription_paused' && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium capitalize">
                            {event.event_type.replace('_', ' ')}
                          </p>
                          {event.event_data?.cancellation_reason && (
                            <p className="text-sm text-muted-foreground">
                              Reason: {getReasonLabel(event.event_data.cancellation_reason)}
                            </p>
                          )}
                          {event.event_data?.cancellation_feedback && (
                            <p className="text-sm text-muted-foreground italic">
                              "{event.event_data.cancellation_feedback}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights & Recommendations */}
      {metrics.totalCancellations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.cancellationReasons).map(([reason, count]) => {
                const percentage = (count / metrics.totalCancellations) * 100;
                if (percentage > 20) {
                  return (
                    <Alert key={reason}>
                      <AlertDescription>
                        <strong>{getReasonLabel(reason)}</strong> accounts for {percentage.toFixed(1)}% of cancellations. 
                        {reason === 'too_expensive' && " Consider offering more flexible pricing or discounts."}
                        {reason === 'not_using' && " Improve onboarding and feature discovery."}
                        {reason === 'missing_features' && " Review feature requests and development priorities."}
                        {reason === 'found_alternative' && " Analyze competitor offerings and differentiation."}
                        {reason === 'technical_issues' && " Prioritize technical stability and user experience."}
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};