import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  started_at: string;
  details: any;
}

export function OutageBanner() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadActiveIncidents();
    
    // Subscribe to realtime incident updates
    const channel = supabase
      .channel('incidents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents'
        },
        () => loadActiveIncidents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActiveIncidents = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .eq('status', 'open')
      .order('severity', { ascending: false })
      .order('started_at', { ascending: false });

    if (data) {
      setIncidents(data);
    }
  };

  const dismissIncident = (incidentId: string) => {
    setDismissed(prev => [...prev, incidentId]);
  };

  const visibleIncidents = incidents.filter(incident => 
    !dismissed.includes(incident.id)
  );

  if (visibleIncidents.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleIncidents.map(incident => (
        <Alert 
          key={incident.id} 
          variant={incident.severity === 'critical' ? 'destructive' : 'default'}
          className="relative"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="pr-8">
            <strong>{incident.title}</strong>
            <span className="ml-2 text-xs opacity-75">
              Started {new Date(incident.started_at).toLocaleTimeString()}
            </span>
          </AlertDescription>
          <button
            onClick={() => dismissIncident(incident.id)}
            className="absolute right-2 top-2 p-1 hover:bg-background/80 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </Alert>
      ))}
    </div>
  );
}