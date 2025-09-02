// FILE: src/components/admin/SecurityDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Users, 
  Settings,
  TrendingUp,
  Clock,
  Ban
} from 'lucide-react';
import { AttackMonitor } from './AttackMonitor';
import { SecurityControls } from './SecurityControls';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityStats {
  totalRequests: number;
  blockedRequests: number;
  riskScoreDistribution: Record<string, number>;
  captchaSuccessRate: number;
  powAvgSolveTime: number;
  topBlockedEndpoints: Array<{ endpoint: string; count: number }>;
  recentAttacks: Array<{
    id: string;
    attack_type: string;
    ip_address: string;
    created_at: string;
    blocked: boolean;
    risk_score?: number;
  }>;
  blockedIPs: Array<{
    id: string;
    ip_address: string;
    reason: string;
    blocked_at: string;
    expires_at?: string;
    is_permanent: boolean;
  }>;
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityStats();
  }, []);

  const loadSecurityStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load attack logs
      const { data: attacks } = await supabase
        .from('attack_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Load blocked IPs
      const { data: blockedIPs } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false })
        .limit(50);

      // Calculate stats from the data
      const totalRequests = attacks?.length || 0;
      const blockedRequests = attacks?.filter(a => a.blocked).length || 0;
      
      const riskScoreDistribution = {
        low: attacks?.filter(a => (a.risk_score || 0) < 50).length || 0,
        medium: attacks?.filter(a => (a.risk_score || 0) >= 50 && (a.risk_score || 0) < 75).length || 0,
        high: attacks?.filter(a => (a.risk_score || 0) >= 75 && (a.risk_score || 0) < 90).length || 0,
        severe: attacks?.filter(a => (a.risk_score || 0) >= 90).length || 0
      };

      const topBlockedEndpoints = Object.entries(
        (attacks?.filter(a => a.blocked) || [])
          .reduce((acc, attack) => {
            const endpoint = attack.endpoint || 'unknown';
            acc[endpoint] = (acc[endpoint] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      )
        .map(([endpoint, count]) => ({ endpoint, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats({
        totalRequests,
        blockedRequests,
        riskScoreDistribution,
        captchaSuccessRate: 85, // Mock data
        powAvgSolveTime: 15000, // Mock data
        topBlockedEndpoints,
        recentAttacks: attacks?.slice(0, 10) || [],
        blockedIPs: blockedIPs || []
      });
    } catch (err) {
      console.error('Failed to load security stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load security stats');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ipId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', ipId);

      if (error) throw error;

      toast({
        title: "IP Unblocked",
        description: "The IP address has been removed from the blocklist.",
      });

      loadSecurityStats();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
      toast({
        title: "Error",
        description: "Failed to unblock IP address.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="mx-auto h-8 w-8 animate-pulse mb-4" />
            <p>Loading security dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-4" />
              <p className="text-destructive">{error}</p>
              <Button onClick={loadSecurityStats} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage security threats</p>
        </div>
        <Button onClick={loadSecurityStats} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.blockedRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.blockedRequests / Math.max(stats.totalRequests, 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAPTCHA Success</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.captchaSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">
              Legitimate users passing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg PoW Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.powAvgSolveTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              Challenge solve time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.riskScoreDistribution).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      level === 'severe' ? 'destructive' :
                      level === 'high' ? 'secondary' :
                      level === 'medium' ? 'outline' : 'default'
                    }
                  >
                    {level}
                  </Badge>
                  <span className="capitalize">{level} Risk</span>
                </div>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="attacks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attacks">Recent Attacks</TabsTrigger>
          <TabsTrigger value="blocked-ips">Blocked IPs</TabsTrigger>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="controls">Security Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="attacks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentAttacks.map(attack => (
                  <div key={attack.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={attack.blocked ? 'destructive' : 'outline'}>
                          {attack.attack_type}
                        </Badge>
                        <span className="font-mono text-sm">{attack.ip_address}</span>
                        {attack.risk_score && (
                          <Badge variant="secondary">
                            Risk: {attack.risk_score}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(attack.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {attack.blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="outline">Allowed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked-ips">
          <Card>
            <CardHeader>
              <CardTitle>Blocked IP Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.blockedIPs.map(ip => (
                  <div key={ip.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{ip.ip_address}</span>
                        <Badge variant={ip.is_permanent ? 'destructive' : 'secondary'}>
                          {ip.is_permanent ? 'Permanent' : 'Temporary'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ip.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Blocked: {new Date(ip.blocked_at).toLocaleString()}
                        {ip.expires_at && ` • Expires: ${new Date(ip.expires_at).toLocaleString()}`}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleUnblockIP(ip.id)}
                      variant="outline"
                      size="sm"
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor">
          <AttackMonitor />
        </TabsContent>

        <TabsContent value="controls">
          <SecurityControls onUpdate={loadSecurityStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}