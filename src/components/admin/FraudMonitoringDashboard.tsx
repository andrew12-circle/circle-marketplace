import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, Eye, CheckCircle, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface FraudLog {
  id: string;
  stripe_payment_intent_id: string;
  risk_score: number;
  risk_level: string;
  outcome_type: string;
  outcome_reason: string;
  amount_cents: number;
  currency: string;
  customer_email: string;
  requires_action: boolean;
  created_at: string;
}

interface FraudAlert {
  id: string;
  alert_type: string;
  severity: string;
  alert_message: string;
  alert_data: any;
  acknowledged: boolean;
  created_at: string;
}

interface FraudStats {
  total_transactions: number;
  high_risk_count: number;
  blocked_count: number;
  manual_review_count: number;
  avg_risk_score: number;
  total_amount_blocked: number;
}

export function FraudMonitoringDashboard() {
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    try {
      // Load fraud logs
      const { data: logs, error: logsError } = await supabase
        .from('fraud_monitoring_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Load fraud alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertsError) throw alertsError;

      // Calculate stats
      const totalTransactions = logs?.length || 0;
      const highRiskCount = logs?.filter(log => log.risk_score >= 60).length || 0;
      const blockedCount = logs?.filter(log => log.outcome_type === 'blocked').length || 0;
      const manualReviewCount = logs?.filter(log => log.outcome_type === 'manual_review').length || 0;
      const avgRiskScore = logs?.length > 0 
        ? logs.reduce((sum, log) => sum + (log.risk_score || 0), 0) / logs.length 
        : 0;
      const totalAmountBlocked = logs
        ?.filter(log => log.outcome_type === 'blocked')
        .reduce((sum, log) => sum + (log.amount_cents || 0), 0) || 0;

      setFraudLogs(logs || []);
      setFraudAlerts(alerts || []);
      setStats({
        total_transactions: totalTransactions,
        high_risk_count: highRiskCount,
        blocked_count: blockedCount,
        manual_review_count: manualReviewCount,
        avg_risk_score: Math.round(avgRiskScore),
        total_amount_blocked: totalAmountBlocked / 100 // Convert to dollars
      });

    } catch (error) {
      console.error('Error loading fraud data:', error);
      toast.error('Failed to load fraud monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({ 
          acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert acknowledged');
      loadFraudData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 80) return "destructive";
    if (riskScore >= 60) return "secondary";
    if (riskScore >= 30) return "outline";
    return "default";
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return "destructive";
      case 'high': return "secondary";
      case 'medium': return "outline";
      default: return "default";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading fraud monitoring data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_transactions}</div>
              <p className="text-xs text-muted-foreground">
                Avg Risk Score: {stats.avg_risk_score}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.high_risk_count}</div>
              <p className="text-xs text-muted-foreground">
                Risk Score ≥60
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Amount</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.total_amount_blocked.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.blocked_count} transactions blocked
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Alerts */}
      {fraudAlerts.filter(alert => !alert.acknowledged).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Fraud Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fraudAlerts
              .filter(alert => !alert.acknowledged)
              .map((alert) => (
                <Alert key={alert.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span>{alert.alert_message}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed View */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Fraud Logs</TabsTrigger>
          <TabsTrigger value="alerts">All Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Fraud Monitoring Logs</CardTitle>
              <CardDescription>
                Detailed view of payment risk assessments and outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fraudLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeColor(log.risk_score)}>
                          Risk: {log.risk_score}
                        </Badge>
                        <Badge variant="outline">{log.risk_level}</Badge>
                        <Badge variant="secondary">{log.outcome_type}</Badge>
                        {log.requires_action && (
                          <Badge variant="destructive">Requires Action</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Amount:</span>
                        <div>${(log.amount_cents / 100).toFixed(2)} {log.currency.toUpperCase()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Customer:</span>
                        <div>{log.customer_email || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium">Payment Intent:</span>
                        <div className="font-mono text-xs">{log.stripe_payment_intent_id}</div>
                      </div>
                      <div>
                        <span className="font-medium">Reason:</span>
                        <div>{log.outcome_reason || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Alert History</CardTitle>
              <CardDescription>
                All fraud alerts and their acknowledgment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fraudAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadgeColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                        {alert.acknowledged && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{alert.alert_message}</p>
                    {alert.alert_data && Object.keys(alert.alert_data).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          View Details
                        </summary>
                        <pre className="text-xs mt-1 p-2 bg-muted rounded">
                          {JSON.stringify(alert.alert_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}