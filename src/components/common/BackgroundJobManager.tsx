// Background job management component
import { useEffect, useState } from 'react';
import { marketplaceAPI } from '@/services/marketplaceAPI';
import { useToast } from '@/hooks/use-toast';

interface BackgroundJob {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  priority: number;
}

export const BackgroundJobManager = () => {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Auto-process jobs every 30 seconds
  useEffect(() => {
    const processJobs = async () => {
      if (isProcessing) return;
      
      setIsProcessing(true);
      try {
        const result = await marketplaceAPI.processBackgroundJob();
        
        if (result && result.success) {
          console.log('Background job processed:', result.message);
          
          // Show toast for important jobs
          if (result.message.includes('Analytics')) {
            toast({
              title: "Analytics Updated",
              description: "Marketplace analytics have been refreshed."
            });
          }
        }
      } catch (error) {
        console.error('Background job processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    // Start processing immediately
    processJobs();

    // Then every 30 seconds
    const interval = setInterval(processJobs, 30000);
    
    return () => clearInterval(interval);
  }, [isProcessing, toast]);

  // Queue common background jobs
  useEffect(() => {
    const queueMaintenanceJobs = async () => {
      try {
        // Queue analytics refresh every hour
        await marketplaceAPI.queueBackgroundJob('refresh_analytics', {}, 3);
        
        // Queue cache cleanup every 30 minutes  
        await marketplaceAPI.queueBackgroundJob('cleanup_cache', {}, 5);
        
        console.log('Maintenance jobs queued');
      } catch (error) {
        console.error('Error queuing maintenance jobs:', error);
      }
    };

    // Queue jobs after component mounts
    const timeout = setTimeout(queueMaintenanceJobs, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  return null; // This is a background component
};