import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, GitBranch, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VersionHistoryPanelProps {
  entityId: string;
  entityType: 'service' | 'vendor';
  onVersionSelect?: (version: any) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  entityId,
  entityType,
  onVersionSelect
}) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVersionHistory();
  }, [entityId, entityType]);

  const loadVersionHistory = async () => {
    setLoading(true);
    try {
      const table = entityType === 'service' ? 'service_drafts' : 'vendor_drafts';
      const idField = entityType === 'service' ? 'service_id' : 'vendor_id';

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(idField, entityId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading version history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStateBadge = (state: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SUBMITTED: 'bg-yellow-100 text-yellow-700',
      CHANGES_REQUESTED: 'bg-orange-100 text-orange-700',
      APPROVED: 'bg-green-100 text-green-700',
      PUBLISHED: 'bg-blue-100 text-blue-700'
    };
    return colors[state as keyof typeof colors] || colors.DRAFT;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No version history</div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, idx) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        v{version.version_number}
                      </Badge>
                      <Badge className={getStateBadge(version.state)}>
                        {version.state}
                      </Badge>
                      {idx === 0 && (
                        <Badge variant="default" className="text-xs">Latest</Badge>
                      )}
                    </div>
                    {onVersionSelect && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onVersionSelect(version)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Created {formatDate(version.created_at)}</span>
                    </div>
                    {version.submitted_at && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>Submitted {formatDate(version.submitted_at)}</span>
                      </div>
                    )}
                    {version.approved_at && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>Approved {formatDate(version.approved_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
