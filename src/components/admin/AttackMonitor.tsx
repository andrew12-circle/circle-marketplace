// FILE: src/components/admin/AttackMonitor.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity } from 'lucide-react';

export function AttackMonitor() {
  const [attacks, setAttacks] = useState<any[]>([]);

  useEffect(() => {
    // Mock real-time attack monitoring
    const interval = setInterval(() => {
      const mockAttack = {
        id: Math.random().toString(),
        type: 'rate_limit_exceeded',
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        timestamp: Date.now(),
        blocked: Math.random() > 0.3
      };
      setAttacks(prev => [mockAttack, ...prev.slice(0, 19)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Live Attack Monitor</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attacks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recent attacks detected
            </p>
          ) : (
            attacks.map(attack => (
              <div key={attack.id} className="flex items-center justify-between p-2 border-l-2 border-l-red-500">
                <div>
                  <Badge variant={attack.blocked ? 'destructive' : 'outline'}>
                    {attack.type}
                  </Badge>
                  <span className="ml-2 font-mono text-sm">{attack.ip}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(attack.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}