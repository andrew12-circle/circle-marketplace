import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, User, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  event_data: any;
  created_at: string;
}

export const SecurityAuditLog: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.is_admin) return;

    const fetchSecurityEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching security events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityEvents();

    // Set up real-time subscription for new security events
    const subscription = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          setEvents(prev => [payload.new as SecurityEvent, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.is_admin]);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('unauthorized') || eventType.includes('blocked')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (eventType.includes('admin')) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    return <User className="h-4 w-4 text-green-500" />;
  };

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType.includes('unauthorized') || eventType.includes('blocked')) {
      return 'destructive' as const;
    }
    if (eventType.includes('admin')) {
      return 'default' as const;
    }
    return 'secondary' as const;
  };

  if (!profile?.is_admin) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading security events...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit Log
          <Badge variant="outline">{events.length} recent events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                {getEventIcon(event.event_type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getEventBadgeVariant(event.event_type)}>
                      {event.event_type.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  {event.event_data && (
                    <div className="text-sm text-muted-foreground">
                      {event.event_data.message && (
                        <p>{event.event_data.message}</p>
                      )}
                      {event.event_data.target_user_id && (
                        <p>Target User: {event.event_data.target_user_id}</p>
                      )}
                      {event.event_data.blocked && (
                        <p className="text-red-600 font-medium">Action was blocked</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No security events recorded
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};