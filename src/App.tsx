import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CSRFProvider } from "@/components/common/CSRFProtection";
import { SecurityHeaders } from "@/components/common/SecurityHeaders";
import { EnhancedSecurityHeaders } from "@/components/security/EnhancedSecurityHeaders";
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
import { CommandCenter } from "./pages/CommandCenter";
import { CommandCenterTest } from "./pages/CommandCenterTest";
import { Academy } from "./pages/Academy";

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering");
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CSRFProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <div style={{ padding: '20px', backgroundColor: 'blue', color: 'white' }}>
            <p>Current URL: {window.location.pathname}</p>
          </div>
          <BrowserRouter>
            <SecurityHeaders />
            <EnhancedSecurityHeaders />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/command-center" element={
              <div style={{ padding: '20px', backgroundColor: 'red', color: 'white', minHeight: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
                <h1 style={{ fontSize: '48px' }}>COMMAND CENTER IS WORKING!</h1>
                <p style={{ fontSize: '24px' }}>URL: {window.location.pathname}</p>
                <p style={{ fontSize: '24px' }}>Time: {new Date().toISOString()}</p>
              </div>
            } />
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
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </CSRFProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
