import { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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

// Lazy load heavy admin components
export const LazyServiceManagementPanel = lazy(() => import('./ServiceManagementPanel').then(m => ({ default: m.ServiceManagementPanel })));
export const LazyVendorManagementPanel = lazy(() => import('./VendorManagementPanel').then(m => ({ default: m.VendorManagementPanel })));
export const LazyRESPAComplianceManager = lazy(() => import('./RESPAComplianceManager').then(m => ({ default: m.RESPAComplianceManager })));
export const LazyVendorActivityAnalytics = lazy(() => import('./OptimizedVendorAnalytics').then(m => ({ default: m.OptimizedVendorAnalytics })));
export const LazyCreatorPayoutDashboard = lazy(() => import('./CreatorPayoutDashboard').then(m => ({ default: m.CreatorPayoutDashboard })));
export const LazyRetentionAnalyticsDashboard = lazy(() => import('./RetentionAnalyticsDashboard').then(m => ({ default: m.RetentionAnalyticsDashboard })));

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