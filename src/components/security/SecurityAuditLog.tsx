import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditEntry {
  id: string;
  attack_type: string;
  user_id?: string;
  ip_address: string;
  risk_score?: number;
  blocked: boolean;
  details?: any;
  created_at: string;
}

export function SecurityAuditLog() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const { toast } = useToast();

  const fetchAuditLog = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attack_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply time filter
      const now = new Date();
      switch (timeFilter) {
        case '1h':
          query = query.gte('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString());
          break;
        case '24h':
          query = query.gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
          break;
        case '7d':
          query = query.gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
          break;
      }

      // Apply event type filter
      if (eventTypeFilter !== 'all') {
        query = query.eq('attack_type', eventTypeFilter);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setAuditLog(data || []);
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
      toast({
        title: "Error",
        description: "Failed to load audit log",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLog();
  }, [timeFilter, eventTypeFilter]);

  const exportAuditLog = async () => {
    try {
      const csvContent = [
        ['Timestamp', 'Event Type', 'IP Address', 'User ID', 'Risk Score', 'Blocked', 'Details'].join(','),
        ...auditLog.map(entry => [
          entry.created_at,
          entry.attack_type,
          entry.ip_address,
          entry.user_id || '',
          entry.risk_score || '',
          entry.blocked ? 'Yes' : 'No',
          entry.details ? JSON.stringify(entry.details) : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Audit log exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit log",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Security Audit Log
            </CardTitle>
            <CardDescription>
              Detailed security event history and audit trail
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="security_check">Security Checks</SelectItem>
                <SelectItem value="rate_limit">Rate Limits</SelectItem>
                <SelectItem value="captcha_required">CAPTCHA</SelectItem>
                <SelectItem value="pow_required">Proof of Work</SelectItem>
                <SelectItem value="blocked_request">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAuditLog}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLog.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 border rounded text-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{entry.attack_type}</Badge>
                  <span className="font-mono text-xs">{entry.ip_address}</span>
                  {entry.risk_score && (
                    <Badge 
                      variant={entry.risk_score >= 70 ? 'destructive' : 
                               entry.risk_score >= 40 ? 'secondary' : 'default'}
                    >
                      Risk: {entry.risk_score}
                    </Badge>
                  )}
                  {entry.blocked && (
                    <Badge variant="destructive">Blocked</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(entry.created_at).toLocaleString()}
                  {entry.user_id && ` • User: ${entry.user_id.substring(0, 8)}...`}
                </div>
              </div>
            </div>
          ))}
          {auditLog.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No audit entries found for selected filters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}