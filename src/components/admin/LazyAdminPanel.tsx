import { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Helper function to handle chunk loading failures
const retryChunkLoad = (fn: () => Promise<any>, retriesLeft = 5, interval = 1000): Promise<any> => {
  return fn().catch((error: Error) => {
    if (
      retriesLeft > 0 && 
      (error.message.includes('Loading chunk') || 
       error.message.includes('Failed to fetch dynamically imported module'))
    ) {
      // Wait and retry
      return new Promise((resolve) => {
        setTimeout(() => resolve(retryChunkLoad(fn, retriesLeft - 1, interval)), interval);
      });
    }
    
    // If all retries failed, reload the page to get fresh chunks
    if (error.message.includes('Loading chunk') || error.message.includes('Failed to fetch dynamically imported module')) {
      console.warn('Chunk loading failed, reloading page to get fresh chunks');
      window.location.reload();
      return Promise.reject(error);
    }
    
    throw error;
  });
};

const PanelFallback = ({ title }: { title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading {title}...
      </CardTitle>
      <CardDescription>Please wait while the panel loads</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </CardContent>
  </Card>
);

// Lazy load heavy admin components with chunk loading failure handling
export const LazyServiceManagementPanel = lazy(() => 
  retryChunkLoad(() => import('./ServiceManagementPanel').then(m => ({ default: m.ServiceManagementPanel })))
);
export const LazyVendorManagementPanel = lazy(() => 
  retryChunkLoad(() => import('./VendorManagementPanel').then(m => ({ default: m.VendorManagementPanel })))
);
export const LazyRESPAComplianceManager = lazy(() => 
  retryChunkLoad(() => import('./RESPAComplianceManager').then(m => ({ default: m.RESPAComplianceManager })))
);
export const LazyVendorActivityAnalytics = lazy(() => 
  retryChunkLoad(() => import('./OptimizedVendorAnalytics').then(m => ({ default: m.OptimizedVendorAnalytics })))
);
export const LazyCreatorPayoutDashboard = lazy(() => 
  retryChunkLoad(() => import('./CreatorPayoutDashboard').then(m => ({ default: m.CreatorPayoutDashboard })))
);
export const LazyRetentionAnalyticsDashboard = lazy(() => 
  retryChunkLoad(() => import('./RetentionAnalyticsDashboard').then(m => ({ default: m.RetentionAnalyticsDashboard })))
);

// Wrapper components with suspense
export const ServiceManagementPanelWrapper = () => (
  <Suspense fallback={<PanelFallback title="Service Management" />}>
    <LazyServiceManagementPanel />
  </Suspense>
);

export const VendorManagementPanelWrapper = () => (
  <Suspense fallback={<PanelFallback title="Vendor Management" />}>
    <LazyVendorManagementPanel />
  </Suspense>
);

export const RESPAComplianceManagerWrapper = () => (
  <Suspense fallback={<PanelFallback title="RESPA Compliance" />}>
    <LazyRESPAComplianceManager />
  </Suspense>
);

export const VendorActivityAnalyticsWrapper = () => (
  <Suspense fallback={<PanelFallback title="Vendor Analytics" />}>
    <LazyVendorActivityAnalytics />
  </Suspense>
);

export const CreatorPayoutDashboardWrapper = () => (
  <Suspense fallback={<PanelFallback title="Creator Payouts" />}>
    <LazyCreatorPayoutDashboard />
  </Suspense>
);

export const RetentionAnalyticsDashboardWrapper = () => (
  <Suspense fallback={<PanelFallback title="Retention Analytics" />}>
    <LazyRetentionAnalyticsDashboard />
  </Suspense>
);