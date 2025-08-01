import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import "./index.css";
import "./i18n";

import Index from "./pages/Index";
import { Marketplace } from "./pages/Marketplace";
import { Academy } from "./pages/Academy";
import Auth from "./pages/Auth";
import { CreatorDashboard } from "./pages/CreatorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { ProfileSettings } from "./pages/ProfileSettings";
import { SavedItems } from "./pages/SavedItems";
import { OrderHistory } from "./pages/OrderHistory";
import { AgentWallet } from "./pages/AgentWallet";
import { Pricing } from "./pages/Pricing";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { PaymentCanceled } from "./pages/PaymentCanceled";
import { ConsultationDemo } from "./pages/ConsultationDemo";
import { VendorRegistration } from "./pages/VendorRegistration";
import { VendorDashboard } from "./pages/VendorDashboard";
import { VendorAnalyticsDashboard } from "./pages/VendorAnalyticsDashboard";
import NotFound from "./pages/NotFound";

// Legal pages
import { TermsOfService } from "./pages/legal/TermsOfService";
import { PrivacyPolicy } from "./pages/legal/PrivacyPolicy";
import { CookiePolicy } from "./pages/legal/CookiePolicy";
import { BuyerProtection } from "./pages/legal/BuyerProtection";
import { SellerAgreement } from "./pages/legal/SellerAgreement";
import { ProhibitedItems } from "./pages/legal/ProhibitedItems";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/academy" element={<Academy />} />
              <Route path="/creator-dashboard" element={<CreatorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/saved" element={<SavedItems />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/wallet" element={<AgentWallet />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/consultation-demo" element={<ConsultationDemo />} />
              <Route path="/vendor-registration" element={<VendorRegistration />} />
              <Route path="/vendor-dashboard" element={<VendorDashboard />} />
              <Route path="/vendor-analytics" element={<VendorAnalyticsDashboard />} />
              
              {/* Legal routes */}
              <Route path="/legal/terms" element={<TermsOfService />} />
              <Route path="/legal/privacy" element={<PrivacyPolicy />} />
              <Route path="/legal/cookies" element={<CookiePolicy />} />
              <Route path="/legal/buyer-protection" element={<BuyerProtection />} />
              <Route path="/legal/seller-agreement" element={<SellerAgreement />} />
              <Route path="/legal/prohibited-items" element={<ProhibitedItems />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);