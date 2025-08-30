// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string;
  event_data: any;
  created_at: string;
  ip_address?: unknown;
  user_agent?: string;
}

export const SecurityEventMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const fetchSecurityEvents = async () => {
    if (!profile?.is_admin) {
      setError('Admin access required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setEvents(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching security events:', err);
      setError('Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, [profile?.is_admin]);

  const getEventSeverity = (eventType: string) => {
    const criticalEvents = [
      'privilege_escalation_attempt',
      'admin_specialty_escalation_attempt',
      'unauthorized_profile_modification_attempt'
    ];
    
    const warningEvents = [
      'admin_privilege_change',
      'creator_verification_change',
      'admin_rate_limit_exceeded'
    ];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  };

  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!profile?.is_admin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Admin access required to view security events.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Event Monitor
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityEvents}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading security events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No security events found
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const severity = getEventSeverity(event.event_type);
              return (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getEventColor(severity) as any}>
                        {formatEventType(event.event_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-medium">User ID:</span> {event.user_id}
                      </div>
                      
                      {event.ip_address && (
                        <div>
                          <span className="font-medium">IP:</span> {String(event.ip_address)}
                        </div>
                      )}
                      
                      {event.event_data && Object.keys(event.event_data).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            Event Details
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(event.event_data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};