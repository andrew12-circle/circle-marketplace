
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, ArrowRight } from 'lucide-react';

interface FunnelMetrics {
  period: string;
  counts: {
    view_pricing: number;
    cta_start_trial_click: number;
    auth_signup_start: number;
    auth_signup_success: number;
    checkout_session_created: number;
    checkout_completed: number;
    subscription_active: number;
  };
  conversion: {
    pricing_to_cta_pct: number;
    cta_to_auth_start_pct: number;
    auth_start_to_success_pct: number;
    auth_success_to_checkout_created_pct: number;
    checkout_created_to_completed_pct: number;
    pricing_to_sub_active_pct: number;
  };
  generated_at: string;
}

export const FunnelAnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_funnel_metrics', {
        p_period: period
      });

      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Error loading funnel metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [period]);

  if (!metrics && !loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No funnel data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const funnelSteps = [
    { name: 'View Pricing', count: metrics?.counts.view_pricing || 0, icon: Users },
    { name: 'Click Trial CTA', count: metrics?.counts.cta_start_trial_click || 0, icon: ArrowRight },
    { name: 'Start Signup', count: metrics?.counts.auth_signup_start || 0, icon: Users },
    { name: 'Complete Signup', count: metrics?.counts.auth_signup_success || 0, icon: Users },
    { name: 'Create Checkout', count: metrics?.counts.checkout_session_created || 0, icon: DollarSign },
    { name: 'Complete Payment', count: metrics?.counts.checkout_completed || 0, icon: DollarSign },
    { name: 'Active Subscription', count: metrics?.counts.subscription_active || 0, icon: TrendingUp },
  ];

  const conversionRates = [
    { from: 'Pricing to CTA', rate: metrics?.conversion.pricing_to_cta_pct || 0 },
    { from: 'CTA to Signup Start', rate: metrics?.conversion.cta_to_auth_start_pct || 0 },
    { from: 'Signup Start to Success', rate: metrics?.conversion.auth_start_to_success_pct || 0 },
    { from: 'Signup to Checkout', rate: metrics?.conversion.auth_success_to_checkout_created_pct || 0 },
    { from: 'Checkout to Payment', rate: metrics?.conversion.checkout_created_to_completed_pct || 0 },
    { from: 'Pricing to Subscription', rate: metrics?.conversion.pricing_to_sub_active_pct || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Funnel Analytics</h2>
          <p className="text-muted-foreground">Track agent journeys and conversion rates</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadMetrics} disabled={loading}>
            <Calendar className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.counts.view_pricing || 0}</div>
            <p className="text-xs text-muted-foreground">viewed pricing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trial Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.counts.auth_signup_success || 0}</div>
            <p className="text-xs text-muted-foreground">completed signup</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paying Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.counts.subscription_active || 0}</div>
            <p className="text-xs text-muted-foreground">active subscriptions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversion.pricing_to_sub_active_pct || 0}%</div>
            <p className="text-xs text-muted-foreground">pricing to paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <p className="text-sm text-muted-foreground">Track drop-offs at each stage</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelSteps.map((step, index) => {
              const Icon = step.icon;
              const prevCount = index > 0 ? funnelSteps[index - 1].count : step.count;
              const conversionRate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '0';
              
              return (
                <div key={step.name} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Icon className="w-6 h-6 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{step.name}</h3>
                      <Badge variant="outline">{step.count} agents</Badge>
                    </div>
                    {index > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {conversionRate}% conversion from previous step
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <div className="bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ 
                          width: `${Math.max(5, (step.count / (funnelSteps[0]?.count || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">Identify biggest drop-off points</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conversionRates.map((conv) => (
              <div key={conv.from} className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">{conv.from}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{conv.rate}%</span>
                  {conv.rate < 20 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
