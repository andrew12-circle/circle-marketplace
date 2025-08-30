import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  event_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const SecurityMonitoringPanel = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSecurityEvents = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching security events:', error);
        toast.error('Failed to fetch security events');
        return;
      }

      setSecurityEvents(((data as any) || []) as SecurityEvent[]);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Failed to fetch security events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'unauthorized_admin_access':
        return 'destructive';
      case 'admin_privilege_change':
        return 'outline';
      case 'suspicious_activity':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'unauthorized_admin_access':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const formatEventData = (eventData: any) => {
    try {
      return JSON.stringify(eventData, null, 2);
    } catch {
      return 'Invalid data';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitoring
          </CardTitle>
          <CardDescription>
            Loading security events...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Monitoring
            </CardTitle>
            <CardDescription>
              Monitor security events and suspicious activities
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityEvents}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {securityEvents.length === 0 ? (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              No security events recorded yet. This is a good sign!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {securityEvents.map((event) => (
              <div 
                key={event.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.event_type)}
                    <span className="font-medium">{event.event_type.replace(/_/g, ' ').toUpperCase()}</span>
                    <Badge variant={getEventTypeColor(event.event_type)}>
                      Security Event
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
                
                {event.user_id && (
                  <div className="text-sm">
                    <span className="font-medium">User ID:</span> {event.user_id}
                  </div>
                )}
                
                {event.ip_address && (
                  <div className="text-sm">
                    <span className="font-medium">IP Address:</span> {event.ip_address}
                  </div>
                )}
                
                {event.event_data && Object.keys(event.event_data).length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Event Data:</span>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                      {formatEventData(event.event_data)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityMonitoringPanel;