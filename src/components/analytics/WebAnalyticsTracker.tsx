import { useWebAnalyticsTracking } from '@/hooks/useWebAnalyticsTracking';

interface WebAnalyticsTrackerProps {
  enabled?: boolean;
}

export function WebAnalyticsTracker({ enabled = true }: WebAnalyticsTrackerProps) {
  useWebAnalyticsTracking({ enabled });

  // This component doesn't render anything
  return null;
}