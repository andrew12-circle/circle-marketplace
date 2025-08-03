import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, User, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface WorkflowEntry {
  id: string;
  action_type: string;
  performed_by: string;
  previous_status: string;
  new_status: string;
  notes: string;
  created_at: string;
  performer_profile?: { display_name: string; business_name: string } | null;
}

interface ComplianceWorkflowLogProps {
  requestId: string;
}

export const ComplianceWorkflowLog = ({ requestId }: ComplianceWorkflowLogProps) => {
  const [logEntries, setLogEntries] = useState<WorkflowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkflowLog();
  }, [requestId]);

  const loadWorkflowLog = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_workflow_log')
        .select(`
          *,
          performer_profile:profiles!performed_by(display_name, business_name)
        `)
        .eq('co_pay_request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogEntries((data as any[])?.map(item => ({
        ...item,
        performer_profile: item.performer_profile?.error ? null : item.performer_profile
      })) || []);
    } catch (error) {
      console.error('Error loading workflow log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string, status: string) => {
    switch (actionType) {
      case 'status_change':
        if (status?.includes('approved')) return <CheckCircle className="w-4 h-4 text-green-600" />;
        if (status?.includes('rejected')) return <XCircle className="w-4 h-4 text-red-600" />;
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'notes_updated':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_vendor: { variant: 'outline', text: 'Pending Vendor', color: 'text-orange-600' },
      vendor_approved: { variant: 'outline', text: 'Vendor Approved', color: 'text-blue-600' },
      pending_compliance: { variant: 'outline', text: 'Pending Compliance', color: 'text-orange-600' },
      compliance_approved: { variant: 'default', text: 'Compliance Approved', color: 'text-green-600' },
      compliance_rejected: { variant: 'destructive', text: 'Compliance Rejected', color: 'text-red-600' },
      final_approved: { variant: 'default', text: 'Final Approved', color: 'text-green-600' },
      expired: { variant: 'outline', text: 'Expired', color: 'text-gray-600' }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const formatActionDescription = (entry: WorkflowEntry) => {
    switch (entry.action_type) {
      case 'status_change':
        return (
          <div>
            <span>Status changed from </span>
            {entry.previous_status && getStatusBadge(entry.previous_status)}
            <span> to </span>
            {entry.new_status && getStatusBadge(entry.new_status)}
          </div>
        );
      case 'notes_updated':
        return <span>Added compliance notes</span>;
      default:
        return <span>Updated request</span>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {logEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No workflow history available</p>
          ) : (
            <div className="space-y-3">
              {logEntries.map((entry, index) => (
                <div key={entry.id} className="flex gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(entry.action_type, entry.new_status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-gray-500" />
                      <span className="text-sm font-medium">
                        {entry.performer_profile?.display_name || 
                         entry.performer_profile?.business_name || 
                         'System'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-1">
                      {formatActionDescription(entry)}
                    </div>
                    
                    {entry.notes && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Notes:</strong> {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};