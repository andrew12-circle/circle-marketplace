import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, Ban, Eye, Activity, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  requests_count: number;
  user_agent?: string;
  is_permanent: boolean;
}

interface SuspiciousActivity {
  ip_address: string;
  requests_count: number;
  time_window: string;
  risk_score: number;
  user_agents: string[];
  endpoints: string[];
}

const AntiScrapingSystem: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [rateLimit, setRateLimit] = useState(100);
  const [timeWindow, setTimeWindow] = useState(60);
  const [loading, setLoading] = useState(false);
  const [realTimeAlerts, setRealTimeAlerts] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlockedIPs();
    fetchSuspiciousActivity();
    setupRealTimeMonitoring();
  }, []);

  const fetchBlockedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBlockedIPs(data || []);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
    }
  };

  const fetchSuspiciousActivity = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-scraping', {
        body: { action: 'get_suspicious_activity' }
      });

      if (error) throw error;
      setSuspiciousActivity(data?.suspicious_activity || []);
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
    }
  };

  const setupRealTimeMonitoring = () => {
    const channel = supabase
      .channel('anti_scraping_alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'blocked_ips' },
        (payload) => {
          const newBlock = payload.new as BlockedIP;
          setRealTimeAlerts(prev => [...prev, `IP ${newBlock.ip_address} blocked for ${newBlock.reason}`]);
          toast({
            title: "🚨 IP Blocked",
            description: `${newBlock.ip_address} blocked for ${newBlock.reason}`,
            variant: "destructive"
          });
          fetchBlockedIPs();
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          const event = payload.new;
          if (event.event_type === 'scraping_attempt_detected') {
            setRealTimeAlerts(prev => [...prev, `Scraping attempt from ${event.event_data?.ip_address}`]);
            toast({
              title: "⚠️ Scraping Detected",
              description: `Suspicious activity from ${event.event_data?.ip_address}`,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const blockIP = async (ipAddress: string, reason: string, permanent = false) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('detect-scraping', {
        body: {
          action: 'block_ip',
          ip_address: ipAddress,
          reason,
          permanent
        }
      });

      if (error) throw error;
      
      toast({
        title: "IP Blocked Successfully",
        description: `${ipAddress} has been blocked`,
      });
      
      fetchBlockedIPs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block IP address",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const unblockIP = async (ipAddress: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('detect-scraping', {
        body: {
          action: 'unblock_ip',
          ip_address: ipAddress
        }
      });

      if (error) throw error;
      
      toast({
        title: "IP Unblocked",
        description: `${ipAddress} has been unblocked`,
      });
      
      fetchBlockedIPs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock IP address",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('detect-scraping', {
        body: {
          action: 'update_settings',
          enabled: isEnabled,
          rate_limit: rateLimit,
          time_window: timeWindow
        }
      });

      if (error) throw error;
      
      toast({
        title: "Settings Updated",
        description: "Anti-scraping settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 8) return { level: 'Critical', color: 'destructive' };
    if (score >= 6) return { level: 'High', color: 'destructive' };
    if (score >= 4) return { level: 'Medium', color: 'secondary' };
    return { level: 'Low', color: 'outline' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Anti-Scraping Protection</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm">Protection</span>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
      </div>

      {/* Real-time Alerts */}
      {realTimeAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {realTimeAlerts.slice(-3).map((alert, index) => (
                <div key={index} className="text-sm">{alert}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Protection Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Requests per IP</label>
              <Input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Time Window (seconds)</label>
              <Input
                type="number"
                value={timeWindow}
                onChange={(e) => setTimeWindow(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={updateSettings} 
              disabled={loading}
              className="w-full"
            >
              Update Settings
            </Button>
          </CardContent>
        </Card>

        {/* Suspicious Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Suspicious Activity</span>
            </CardTitle>
            <CardDescription>IPs showing potential scraping behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {suspiciousActivity.map((activity, index) => {
                  const risk = getRiskLevel(activity.risk_score);
                  return (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono">{activity.ip_address}</code>
                        <Badge variant={risk.color as any}>{risk.level}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>{activity.requests_count} requests in {activity.time_window}</div>
                        <div>Score: {activity.risk_score}/10</div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => blockIP(activity.ip_address, 'Suspicious scraping activity')}
                          className="mt-2 w-full"
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Block IP
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {suspiciousActivity.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No suspicious activity detected
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Blocked IPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ban className="h-5 w-5" />
              <span>Blocked IPs</span>
            </CardTitle>
            <CardDescription>{blockedIPs.length} IPs currently blocked</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {blockedIPs.map((blocked) => (
                  <div key={blocked.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono">{blocked.ip_address}</code>
                      <Badge variant={blocked.is_permanent ? 'destructive' : 'secondary'}>
                        {blocked.is_permanent ? 'Permanent' : 'Temporary'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{blocked.reason}</div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(blocked.blocked_at).toLocaleString()}</span>
                      </div>
                      <div>{blocked.requests_count} requests detected</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unblockIP(blocked.ip_address)}
                        className="mt-2 w-full"
                      >
                        Unblock
                      </Button>
                    </div>
                  </div>
                ))}
                {blockedIPs.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No blocked IPs
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AntiScrapingSystem;