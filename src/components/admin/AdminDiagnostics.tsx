import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, RefreshCw, AlertTriangle, CheckCircle, Globe, Clock } from 'lucide-react';

interface DiagnosticData {
  clientIP?: string;
  country?: string;
  lastFailingEndpoint?: string;
  connectionStable: boolean;
  lastUpdate: Date;
}

export const AdminDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({
    connectionStable: true,
    lastUpdate: new Date()
  });
  const [retrying, setRetrying] = useState(false);

  const detectClientInfo = async () => {
    try {
      // Simple IP detection
      const response = await fetch('https://api.ipify.org?format=json', { 
        signal: AbortSignal.timeout(5000) 
      });
      const data = await response.json();
      
      setDiagnostics(prev => ({
        ...prev,
        clientIP: data.ip,
        connectionStable: true,
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.warn('IP detection failed:', error);
      setDiagnostics(prev => ({
        ...prev,
        connectionStable: false,
        lastFailingEndpoint: 'IP Detection Service',
        lastUpdate: new Date()
      }));
    }
  };

  const retryAllConnections = async () => {
    setRetrying(true);
    try {
      await detectClientInfo();
      // Force page reload to retry all failed connections
      window.location.reload();
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    detectClientInfo();
  }, []);

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Wifi className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium text-blue-800">
              Admin Diagnostics
            </span>
            
            <div className="flex items-center gap-3 text-sm">
              {diagnostics.clientIP && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>IP: {diagnostics.clientIP}</span>
                </div>
              )}
              
              {diagnostics.country && (
                <Badge variant="outline" className="text-xs">
                  {diagnostics.country}
                </Badge>
              )}
              
              <div className="flex items-center gap-1">
                {diagnostics.connectionStable ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                )}
                <span className={diagnostics.connectionStable ? 'text-green-700' : 'text-red-700'}>
                  {diagnostics.connectionStable ? 'Stable' : 'Degraded'}
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{diagnostics.lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={retryAllConnections}
            disabled={retrying}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry All'}
          </Button>
        </div>
        
        {diagnostics.lastFailingEndpoint && (
          <div className="mt-2 text-sm text-amber-700">
            Last failing: {diagnostics.lastFailingEndpoint}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};