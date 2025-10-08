import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Clock } from 'lucide-react';

interface DraftComparisonViewProps {
  liveData: any;
  draftData: any;
  entityType: 'service' | 'vendor';
}

export const DraftComparisonView: React.FC<DraftComparisonViewProps> = ({
  liveData,
  draftData,
  entityType
}) => {
  const getChangedFields = () => {
    if (!liveData || !draftData) return [];
    
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    Object.keys(draftData).forEach(key => {
      if (JSON.stringify(liveData[key]) !== JSON.stringify(draftData[key])) {
        changes.push({
          field: key,
          oldValue: liveData[key],
          newValue: draftData[key]
        });
      }
    });
    
    return changes;
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const changes = getChangedFields();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Changes Summary</h3>
        <Badge variant="secondary">{changes.length} fields modified</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Live Version Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline">Live Version</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {changes.map((change, idx) => (
                  <div key={idx} className="border-b pb-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {change.field.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-sm bg-muted p-2 rounded">
                      {formatValue(change.oldValue)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Draft Version Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="default">Draft Version</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {changes.map((change, idx) => (
                  <div key={idx} className="border-b pb-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {change.field.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-sm bg-primary/10 p-2 rounded border-l-4 border-primary">
                      {formatValue(change.newValue)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {changes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No changes detected
        </div>
      )}
    </div>
  );
};
