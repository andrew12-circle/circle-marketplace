import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { CSRFProvider } from "@/components/common/CSRFProtection";
import { SecurityHeaders } from "@/components/common/SecurityHeaders";
import { EnhancedSecurityHeaders } from "@/components/security/EnhancedSecurityHeaders";
import { SecurityStatusIndicator } from "@/components/security/SecurityEnhancementSystem";
import RequestLogger from "@/components/security/RequestLogger";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { OrderHistory } from "./pages/OrderHistory";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { PaymentCanceled } from "./pages/PaymentCanceled";
import { Pricing } from "./pages/Pricing";
import { ProfileSettings } from "./pages/ProfileSettings";
import { AgentWallet } from "./pages/AgentWallet";
import { AdminAccounting } from "./pages/AdminAccounting";
import { SavedItems } from "./pages/SavedItems";
import { ConsultationDemo } from "./pages/ConsultationDemo";
import { VendorDashboard } from "./pages/VendorDashboard";
import { VendorAnalyticsDashboard } from "./pages/VendorAnalyticsDashboard";
import { VendorRegistration } from "./pages/VendorRegistration";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import SupportDashboard from "./pages/SupportDashboard";
import AdvancedFeaturesDashboard from "./pages/AdvancedFeaturesDashboard";
import AIDashboard from "./pages/AIDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { TermsOfService } from "./pages/legal/TermsOfService";
import { PrivacyPolicy } from "./pages/legal/PrivacyPolicy";
import { CookiePolicy } from "./pages/legal/CookiePolicy";
import { SellerAgreement } from "./pages/legal/SellerAgreement";
import { BuyerProtection } from "./pages/legal/BuyerProtection";
import { ProhibitedItems } from "./pages/legal/ProhibitedItems";
import CommandCenter from "./pages/CommandCenter";
import { CommandCenterTest } from "./pages/CommandCenterTest";
import { Academy } from "./pages/Academy";

const queryClient = new QueryClient();

const App = () => {
  // App component rendering
  return (
    <ErrorBoundary section="Application">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CSRFProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <div className="fixed top-4 right-4 z-50">
                <SecurityStatusIndicator />
              </div>
               <BrowserRouter>
                 <SecurityHeaders />
                 <EnhancedSecurityHeaders />
                 <RequestLogger />
                 <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/command-center" element={<CommandCenter />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/wallet" element={<AgentWallet />} />
                <Route path="/saved" element={<SavedItems />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-canceled" element={<PaymentCanceled />} />
                <Route path="/consultation-demo" element={<ConsultationDemo />} />
                <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                <Route path="/vendor-analytics" element={<VendorAnalyticsDashboard />} />
                <Route path="/vendor-registration" element={<VendorRegistration />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/support" element={<SupportDashboard />} />
                <Route path="/advanced-features" element={<AdvancedFeaturesDashboard />} />
                <Route path="/ai-dashboard" element={<AIDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/accounting" element={<AdminAccounting />} />
                
                {/* Legal Pages */}
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/seller-agreement" element={<SellerAgreement />} />
                <Route path="/buyer-protection" element={<BuyerProtection />} />
                <Route path="/prohibited-items" element={<ProhibitedItems />} />
                
                {/* Catch-all route MUST be last */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </CSRFProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
