import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load all pages for optimal bundle splitting  
const Index = lazy(() => import('../pages/Index'));
const Marketplace = lazy(() => import('../pages/Marketplace').then(m => ({ default: m.Marketplace })));
const Academy = lazy(() => import('../pages/Academy').then(m => ({ default: m.Academy })));
const Auth = lazy(() => import('../pages/Auth'));
const CreatorDashboard = lazy(() => import('../pages/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const ProfileSettings = lazy(() => import('../pages/ProfileSettings'));
const SavedItems = lazy(() => import('../pages/SavedItems'));
const OrderHistory = lazy(() => import('../pages/OrderHistory'));
const AgentWallet = lazy(() => import('../pages/AgentWallet'));
const Pricing = lazy(() => import('../pages/Pricing'));
const PaymentSuccess = lazy(() => import('../pages/PaymentSuccess'));
const PaymentCanceled = lazy(() => import('../pages/PaymentCanceled'));
const ConsultationDemo = lazy(() => import('../pages/ConsultationDemo'));
const VendorRegistration = lazy(() => import('../pages/VendorRegistration'));
const VendorDashboard = lazy(() => import('../pages/VendorDashboard'));
const VendorAnalyticsDashboard = lazy(() => import('../pages/VendorAnalyticsDashboard'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Legal pages
const TermsOfService = lazy(() => import('../pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('../pages/legal/CookiePolicy'));
const BuyerProtection = lazy(() => import('../pages/legal/BuyerProtection'));
const SellerAgreement = lazy(() => import('../pages/legal/SellerAgreement'));
const ProhibitedItems = lazy(() => import('../pages/legal/ProhibitedItems'));

// Enhanced loading component with skeleton
const LoadingFallback = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="relative">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-primary/20"></div>
    </div>
    <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
    
    {/* Skeleton content */}
    <div className="w-full max-w-md space-y-3 mt-8">
      <div className="h-4 bg-muted rounded animate-pulse"></div>
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
      <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
    </div>
  </div>
);

// Enhanced error boundary component
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<any> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route Error:', error, errorInfo);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error reporting service here
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This page encountered an error. Please try refreshing or contact support if the problem persists.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// High-performance router with preloading
const OptimizedRouter = () => {
  // Preload critical routes on hover/focus
  React.useEffect(() => {
    const preloadRoutes = [
      () => import('../pages/Marketplace'),
      () => import('../pages/Academy'),
      () => import('../pages/Auth')
    ];

    // Preload after initial load
    const timer = setTimeout(() => {
      preloadRoutes.forEach(loader => {
        loader().catch(() => {
          // Silently handle preload failures
        });
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Routes>
      <Route path="/" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading homepage..." />}>
            <Index />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/auth" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading authentication..." />}>
            <Auth />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/marketplace" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading marketplace..." />}>
            <Marketplace />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/academy" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading academy..." />}>
            <Academy />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/creator-dashboard" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading creator dashboard..." />}>
            <CreatorDashboard />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/admin" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading admin dashboard..." />}>
            <AdminDashboard />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/profile-settings" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading profile settings..." />}>
            <ProfileSettings />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/saved" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading saved items..." />}>
            <SavedItems />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/orders" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading order history..." />}>
            <OrderHistory />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/wallet" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading wallet..." />}>
            <AgentWallet />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/pricing" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading pricing..." />}>
            <Pricing />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/payment-success" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Processing payment..." />}>
            <PaymentSuccess />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/payment-canceled" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading..." />}>
            <PaymentCanceled />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/consultation-demo" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading consultation demo..." />}>
            <ConsultationDemo />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/vendor-registration" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading vendor registration..." />}>
            <VendorRegistration />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/vendor-dashboard" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading vendor dashboard..." />}>
            <VendorDashboard />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/vendor-analytics" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading analytics..." />}>
            <VendorAnalyticsDashboard />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      {/* Legal routes */}
      <Route path="/legal/terms" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading terms..." />}>
            <TermsOfService />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/legal/privacy" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading privacy policy..." />}>
            <PrivacyPolicy />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/legal/cookies" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading cookie policy..." />}>
            <CookiePolicy />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/legal/buyer-protection" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading buyer protection..." />}>
            <BuyerProtection />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/legal/seller-agreement" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading seller agreement..." />}>
            <SellerAgreement />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="/legal/prohibited-items" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading prohibited items..." />}>
            <ProhibitedItems />
          </Suspense>
        </RouteErrorBoundary>
      } />
      
      <Route path="*" element={
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingFallback text="Loading..." />}>
            <NotFound />
          </Suspense>
        </RouteErrorBoundary>
      } />
    </Routes>
  );
};

export default OptimizedRouter;