import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Image,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessingStatus {
  total: number;
  processed: number;
  pending: number;
  recentLogs: Array<{
    id: string;
    service_id: string;
    status: string;
    original_url?: string;
    vectorized_url?: string;
    error_message?: string;
    processed_at: string;
  }>;
}

export const ImageVectorizationPanel = () => {
  const [status, setStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    pending: 0,
    recentLogs: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchSize, setBatchSize] = useState(10);

  useEffect(() => {
    fetchStatus();
    
    // Set up polling for status updates
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('vectorize-images', {
        body: { action: 'get-status' }
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Failed to fetch processing status');
    }
  };

  const startBatchProcessing = async () => {
    if (status.pending === 0) {
      toast.info('No images pending vectorization');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('vectorize-images', {
        body: { 
          action: 'process-batch',
          batchSize 
        }
      });

      if (error) throw error;
      
      toast.success(`Started batch processing of ${batchSize} images`);
      
      // Poll for updates more frequently during processing
      const pollInterval = setInterval(async () => {
        await fetchStatus();
        
        // Check if processing is likely complete
        const currentStatus = await getCurrentStatus();
        if (currentStatus && currentStatus.pending === 0) {
          clearInterval(pollInterval);
          setIsProcessing(false);
          toast.success('Batch processing completed!');
        }
      }, 5000);

      // Stop polling after 10 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsProcessing(false);
      }, 600000);

    } catch (error) {
      console.error('Error starting batch processing:', error);
      toast.error('Failed to start batch processing');
      setIsProcessing(false);
    }
  };

  const getCurrentStatus = async (): Promise<ProcessingStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('vectorize-images', {
        body: { action: 'get-status' }
      });
      return error ? null : data;
    } catch {
      return null;
    }
  };

  const processSingleImage = async (serviceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('vectorize-images', {
        body: { 
          action: 'process-single',
          serviceId 
        }
      });

      if (error) throw error;
      
      toast.success('Single image processed successfully');
      await fetchStatus();
    } catch (error) {
      console.error('Error processing single image:', error);
      toast.error('Failed to process single image');
    }
  };

  const progressPercentage = status.total > 0 ? (status.processed / status.total) * 100 : 0;

  const getStatusIcon = (logStatus: string) => {
    switch (logStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (logStatus: string) => {
    switch (logStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Processing</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.total}</div>
            <p className="text-xs text-muted-foreground">
              Services with images
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vectorized</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status.processed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{status.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting conversion
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Batch Processing
          </CardTitle>
          <CardDescription>
            Convert multiple raster images to vector format automatically using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {status.processed} of {status.total} images processed
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {status.pending > 0 && (
            <Alert>
              <AlertDescription>
                {status.pending} images are pending vectorization. This process uses AI to analyze your images and create clean SVG vector versions.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="batchSize" className="text-sm font-medium">
                Batch Size:
              </label>
              <select
                id="batchSize"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
                disabled={isProcessing}
              >
                <option value={5}>5 images</option>
                <option value={10}>10 images</option>
                <option value={20}>20 images</option>
                <option value={50}>50 images</option>
              </select>
            </div>

            <Button
              onClick={startBatchProcessing}
              disabled={isProcessing || status.pending === 0}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Batch Processing
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={fetchStatus}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Processing Logs</TabsTrigger>
          <TabsTrigger value="preview">Preview Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Processing Activity</CardTitle>
              <CardDescription>
                Latest vectorization attempts and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.recentLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No processing logs yet
                </p>
              ) : (
                <div className="space-y-4">
                  {status.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="text-sm font-medium">
                            Service ID: {log.service_id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.processed_at).toLocaleString()}
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-red-600 mt-1">
                              {log.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vectorization Results</CardTitle>
              <CardDescription>
                Preview of successfully vectorized images
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.recentLogs.filter(log => log.status === 'success' && log.vectorized_url).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No vectorized images to preview yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {status.recentLogs
                    .filter(log => log.status === 'success' && log.vectorized_url)
                    .slice(0, 6)
                    .map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Service: {log.service_id.slice(0, 8)}...
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs font-medium mb-1">Original</p>
                            {log.original_url && (
                              <img
                                src={log.original_url}
                                alt="Original"
                                className="w-full h-20 object-cover rounded border"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-1">Vector</p>
                            {log.vectorized_url && (
                              <img
                                src={log.vectorized_url}
                                alt="Vectorized"
                                className="w-full h-20 object-cover rounded border"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};