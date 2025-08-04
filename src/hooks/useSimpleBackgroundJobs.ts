import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSimpleBackgroundJobs = () => {
  const { toast } = useToast();

  const queueAnalyticsRefresh = async (priority: number = 3) => {
    try {
      // Call the analytics optimizer edge function directly
      const { data, error } = await supabase.functions.invoke('analytics-optimizer', {
        body: { action: 'refresh_vendor_analytics' }
      });

      if (error) {
        console.error('Error refreshing analytics:', error);
        return null;
      }

      console.log('Analytics refresh queued successfully');
      return true;
    } catch (error) {
      console.error('Error queueing analytics refresh:', error);
      toast({
        title: "Error",
        description: "Failed to queue analytics refresh",
        variant: "destructive"
      });
      return null;
    }
  };

  const processJobs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('background-job-processor');

      if (error) {
        console.error('Error processing jobs:', error);
        return false;
      }

      console.log('Jobs processed:', data);
      return true;
    } catch (error) {
      console.error('Error processing jobs:', error);
      return false;
    }
  };

  return {
    queueAnalyticsRefresh,
    processJobs
  };
};