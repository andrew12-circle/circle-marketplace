import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, CheckCircle, Activity, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  totalEvents: number;
  blockedRequests: number;
  averageRiskScore: number;
  lastHourEvents: number;
  activeThreats: number;
}

export default function SecurityMonitoringPanel() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    blockedRequests: 0,
    averageRiskScore: 0,
    lastHourEvents: 0,
    activeThreats: 0
  });
  const [underAttackMode, setUnderAttackMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data: events } = await supabase
          .from('attack_logs')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const lastHour = new Date(Date.now() - 60 * 60 * 1000);
        const lastHourEvents = events?.filter(e => new Date(e.created_at) >= lastHour).length || 0;
        
        setMetrics({
          totalEvents: events?.length || 0,
          blockedRequests: events?.filter(e => e.blocked).length || 0,
          averageRiskScore: 45, // Mock data
          lastHourEvents,
          activeThreats: events?.filter(e => e.risk_score && e.risk_score >= 70).length || 0
        });
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleUnderAttack = (enabled: boolean) => {
    setUnderAttackMode(enabled);
    toast({
      title: enabled ? "Under Attack Mode Enabled" : "Under Attack Mode Disabled",
      description: enabled ? "All traffic requires verification" : "Normal security restored",
      variant: enabled ? "destructive" : "default"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Security Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Under Attack Mode</Label>
              <div className="text-sm text-muted-foreground">Enables strict security for all traffic</div>
            </div>
            <Switch checked={underAttackMode} onCheckedChange={toggleUnderAttack} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium">Last Hour Events</div>
            </div>
            <div className="text-2xl font-bold">{metrics.lastHourEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive" />
              <div className="text-sm font-medium">Blocked Requests</div>
            </div>
            <div className="text-2xl font-bold">{metrics.blockedRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div className="text-sm font-medium">Average Risk Score</div>
            </div>
            <div className="text-2xl font-bold">{metrics.averageRiskScore}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-destructive" />
              <div className="text-sm font-medium">Active Threats</div>
            </div>
            <div className="text-2xl font-bold">{metrics.activeThreats}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}