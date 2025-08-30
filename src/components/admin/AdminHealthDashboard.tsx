import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Activity, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface HealthMetrics {
  errorCount: number;
  criticalSecurityEvents: number;
  dbResponseTime: number;
  activeIncidents: number;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  started_at: string;
  resolved_at?: string;
  details: any;
}

export function AdminHealthDashboard() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadHealthData();
    
    // Set up real-time subscriptions
    const incidentsChannel = supabase
      .channel('admin-incidents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents'
        },
        () => loadIncidents()
      )
      .subscribe();

    const errorsChannel = supabase
      .channel('admin-errors')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_errors'
        },
        () => loadMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incidentsChannel);
      supabase.removeChannel(errorsChannel);
    };
  }, []);

  const loadHealthData = async () => {
    setLoading(true);
    await Promise.all([loadMetrics(), loadIncidents()]);
    setLoading(false);
  };

  const loadMetrics = async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get recent errors
      const { count: errorCount } = await supabase
        .from('client_errors')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fiveMinutesAgo.toISOString());

      // Get security events
      const { count: securityCount } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fiveMinutesAgo.toISOString());

      // Get active incidents
      const { count: activeIncidents } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status' as any, 'open' as any);

      // Test DB response time
      const dbStart = Date.now();
      await supabase.from('app_config').select('id').limit(1);
      const dbResponseTime = Date.now() - dbStart;

      setMetrics({
        errorCount: errorCount || 0,
        criticalSecurityEvents: securityCount || 0,
        dbResponseTime,
        activeIncidents: activeIncidents || 0
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const loadIncidents = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (data) {
      setIncidents(data as any[]);
    }
  };

  const runHealthCheck = async () => {
    try {
      setSending(true);
      
      const { data, error } = await supabase.functions.invoke('monitor-health', {
        body: { source: 'manual_admin_check' }
      });

      if (error) throw error;

      toast.success('Health check completed');
      await loadHealthData();
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Health check failed');
    } finally {
      setSending(false);
    }
  };

  const sendTestAlert = async () => {
    try {
      setSending(true);
      
      // Create a test incident
      const { error } = await supabase
        .from('incidents')
        .insert({
          title: 'Test Alert - Admin Dashboard',
          severity: 'low',
          status: 'open',
          details: JSON.stringify({
            type: 'test',
            source: 'admin_dashboard',
            timestamp: new Date().toISOString()
          })
        } as any);

      if (error) throw error;

      toast.success('Test alert sent');
      await loadIncidents();
    } catch (error) {
      console.error('Failed to send test alert:', error);
      toast.error('Failed to send test alert');
    } finally {
      setSending(false);
    }
  };

  const resolveIncident = async (incidentId: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        } as any)
        .eq('id' as any, incidentId as any);

      if (error) throw error;

      toast.success('Incident resolved');
      await loadIncidents();
    } catch (error) {
      console.error('Failed to resolve incident:', error);
      toast.error('Failed to resolve incident');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getHealthStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'secondary' };
    
    if (metrics.activeIncidents > 0) {
      return { status: 'incidents', color: 'destructive' };
    }
    
    if (metrics.errorCount > 10 || metrics.dbResponseTime > 2000) {
      return { status: 'degraded', color: 'secondary' };
    }
    
    return { status: 'healthy', color: 'success' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={health.color as any}>
                {health.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors (5min)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.errorCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Response</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.dbResponseTime || 0}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeIncidents || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button onClick={runHealthCheck} disabled={sending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${sending ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>
        <Button variant="outline" onClick={sendTestAlert} disabled={sending}>
          <Send className="h-4 w-4 mr-2" />
          Send Test Alert
        </Button>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.length === 0 ? (
              <p className="text-muted-foreground">No incidents recorded</p>
            ) : (
              incidents.map(incident => (
                <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(incident.severity) as any}>
                        {incident.severity}
                      </Badge>
                      <Badge variant={incident.status === 'open' ? 'destructive' : 'outline'}>
                        {incident.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium mt-1">{incident.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Started: {new Date(incident.started_at).toLocaleString()}
                      {incident.resolved_at && (
                        <span className="ml-2">
                          • Resolved: {new Date(incident.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                  {incident.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveIncident(incident.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}