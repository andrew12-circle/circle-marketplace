import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, CheckCircle, XCircle, Edit, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModerationAuditLogProps {
  entityId?: string;
  entityType?: 'service' | 'vendor';
  limit?: number;
}

export const ModerationAuditLog: React.FC<ModerationAuditLogProps> = ({
  entityId,
  entityType,
  limit = 50
}) => {
  const { toast } = useToast();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuditLog();
  }, [entityId, entityType]);

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('moderation_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityId && entityType) {
        const draftType = entityType === 'service' ? 'service_draft' : 'vendor_draft';
        query = query.eq('draft_type', draftType).eq('draft_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Error loading audit log:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit log',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    const icons = {
      SUBMIT: Send,
      APPROVE: CheckCircle,
      REJECT: XCircle,
      REQUEST_CHANGES: Edit
    };
    return icons[actionType as keyof typeof icons] || Shield;
  };

  const getActionColor = (actionType: string) => {
    const colors = {
      SUBMIT: 'bg-blue-100 text-blue-700 border-blue-200',
      APPROVE: 'bg-green-100 text-green-700 border-green-200',
      REJECT: 'bg-red-100 text-red-700 border-red-200',
      REQUEST_CHANGES: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[actionType as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Moderation Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs</div>
          ) : (
            <div className="space-y-3">
              {actions.map((action) => {
                const Icon = getActionIcon(action.action_type);
                return (
                  <div
                    key={action.id}
                    className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getActionColor(action.action_type)}>
                          <Icon className="h-3 w-3 mr-1" />
                          {action.action_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{action.version_number}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(action.created_at)}
                      </span>
                    </div>

                    {action.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {action.notes}
                      </p>
                    )}

                    {action.metadata && Object.keys(action.metadata).length > 0 && (
                      <div className="mt-2 text-xs bg-muted p-2 rounded">
                        <code>{JSON.stringify(action.metadata, null, 2)}</code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
