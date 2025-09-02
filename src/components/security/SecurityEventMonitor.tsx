import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Shield, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  attack_type: string;
  ip_address: string;
  user_id?: string;
  endpoint?: string;
  risk_score?: number;
  blocked: boolean;
  details?: any;
  created_at: string;
}

export function SecurityEventMonitor() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attack_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      toast({
        title: "Error",
        description: "Failed to load security events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('security_events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'attack_logs' },
        (payload) => {
          setEvents(prev => [payload.new as SecurityEvent, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('blocked') || eventType.includes('attack')) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (eventType.includes('captcha') || eventType.includes('pow')) {
      return <Shield className="h-4 w-4 text-warning" />;
    }
    return <Zap className="h-4 w-4 text-primary" />;
  };

  const getRiskBadgeVariant = (riskScore?: number) => {
    if (!riskScore) return 'secondary';
    if (riskScore >= 80) return 'destructive';
    if (riskScore >= 60) return 'destructive';
    if (riskScore >= 40) return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Live Security Events
            </CardTitle>
            <CardDescription>
              Real-time monitoring of security events and threats
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getEventIcon(event.attack_type)}
                <div>
                  <div className="font-medium">{event.attack_type}</div>
                  <div className="text-sm text-muted-foreground">
                    IP: {event.ip_address}
                    {event.endpoint && ` • ${event.endpoint}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.risk_score && (
                  <Badge variant={getRiskBadgeVariant(event.risk_score)}>
                    Risk: {event.risk_score}
                  </Badge>
                )}
                {event.blocked && (
                  <Badge variant="destructive">Blocked</Badge>
                )}
              </div>
            </div>
          ))}
          {events.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No security events recorded
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}