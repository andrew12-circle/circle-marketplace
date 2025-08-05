import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { CSRFProvider } from "@/components/common/CSRFProtection";
import { SecurityHeaders } from "@/components/common/SecurityHeaders";
import { EnhancedSecurityHeaders } from "@/components/security/EnhancedSecurityHeaders";
import { SecurityStatusIndicator } from "@/components/security/SecurityEnhancementSystem";
import RequestLogger from "@/components/security/RequestLogger";
import { HelpWidget } from "@/components/support/HelpWidget";

// Import pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { Academy } from "@/pages/Academy";
import { Marketplace } from "@/pages/Marketplace";
import AdminDashboard from "@/pages/AdminDashboard";
import { VendorDashboard } from "@/pages/VendorDashboard";
import { VendorAnalyticsDashboard } from "@/pages/VendorAnalyticsDashboard";
import { CreatorDashboard } from "@/pages/CreatorDashboard";
import AIDashboard from "@/pages/AIDashboard";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import SecurityDashboard from "@/pages/SecurityDashboard";
import SupportDashboard from "@/pages/SupportDashboard";
import AdvancedFeaturesDashboard from "@/pages/AdvancedFeaturesDashboard";
import { AdminAccounting } from "@/pages/AdminAccounting";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 10 * 60 * 1000, // 10 minutes - longer cache
      gcTime: 15 * 60 * 1000, // 15 minutes cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary section="Application">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CSRFProvider>
            <AuthProvider>
              <CartProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/academy" element={<Academy />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    
                    {/* Admin Dashboard Routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/admin-accounting" element={<AdminAccounting />} />
                    
                    {/* Vendor Dashboard Routes */}
                    <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                    <Route path="/vendor-analytics" element={<VendorAnalyticsDashboard />} />
                    
                    {/* Creator Dashboard */}
                    <Route path="/creator-dashboard" element={<CreatorDashboard />} />
                    
                    {/* Analytics & AI Dashboards */}
                    <Route path="/ai-dashboard" element={<AIDashboard />} />
                    <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
                    
                    {/* System Dashboards */}
                    <Route path="/security-dashboard" element={<SecurityDashboard />} />
                    <Route path="/support-dashboard" element={<SupportDashboard />} />
                    <Route path="/advanced-features" element={<AdvancedFeaturesDashboard />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                  <Sonner />
                  <HelpWidget />
                  <SecurityHeaders />
                  <EnhancedSecurityHeaders />
                  <RequestLogger />
                </BrowserRouter>
              </CartProvider>
            </AuthProvider>
          </CSRFProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;