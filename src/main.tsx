import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpiritualCoverageProvider } from "@/contexts/SpiritualCoverageContext";
import { CartProvider } from "@/contexts/CartContext";
import { cacheManager } from "./utils/cacheManager";
import "./index.css";
import "./i18n";

// Critical pages loaded immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages
const Marketplace = lazy(() => import("./pages/Marketplace").then(m => ({ default: m.Marketplace })));
const Academy = lazy(() => import("./pages/Academy").then(m => ({ default: m.Academy })));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard").then(m => ({ default: m.CreatorDashboard })));
const CreatorPaymentSetupPage = lazy(() => import("./pages/CreatorPaymentSetup"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings").then(m => ({ default: m.ProfileSettings })));
const SavedItems = lazy(() => import("./pages/SavedItems").then(m => ({ default: m.SavedItems })));
const OrderHistory = lazy(() => import("./pages/OrderHistory").then(m => ({ default: m.OrderHistory })));
const AgentWallet = lazy(() => import("./pages/AgentWallet").then(m => ({ default: m.AgentWallet })));
const Pricing = lazy(() => import("./pages/Pricing").then(m => ({ default: m.Pricing })));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled").then(m => ({ default: m.PaymentCanceled })));
const ConsultationDemo = lazy(() => import("./pages/ConsultationDemo").then(m => ({ default: m.ConsultationDemo })));
const VendorRegistration = lazy(() => import("./pages/VendorRegistration").then(m => ({ default: m.VendorRegistration })));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard").then(m => ({ default: m.VendorDashboard })));
const VendorAnalyticsDashboard = lazy(() => import("./pages/VendorAnalyticsDashboard").then(m => ({ default: m.VendorAnalyticsDashboard })));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const HealthStability = lazy(() => import("./pages/HealthStability"));

// Ministry pages
const CircleMinistry = lazy(() => import("./pages/CircleMinistry"));
const MinistrySuccess = lazy(() => import("./pages/MinistrySuccess"));

// Legal pages
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService").then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy").then(m => ({ default: m.CookiePolicy })));
const BuyerProtection = lazy(() => import("./pages/legal/BuyerProtection").then(m => ({ default: m.BuyerProtection })));
const SellerAgreement = lazy(() => import("./pages/legal/SellerAgreement").then(m => ({ default: m.SellerAgreement })));
const ProhibitedItems = lazy(() => import("./pages/legal/ProhibitedItems").then(m => ({ default: m.ProhibitedItems })));

// Loading component for lazy routes
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
      networkMode: 'online',
    },
  },
});

// Clear cache if version mismatch
cacheManager.checkAndClearCache();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SpiritualCoverageProvider>
        <AuthProvider>
          <CartProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/creator-dashboard" element={<CreatorDashboard />} />
                <Route path="/creator-payment-setup" element={<CreatorPaymentSetupPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
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
                <Route path="/command-center" element={<CommandCenter />} />
                <Route path="/health" element={<HealthStability />} />
                
                {/* Ministry routes */}
                <Route path="/ministry" element={<CircleMinistry />} />
                <Route path="/ministry/success" element={<MinistrySuccess />} />
                <Route path="/minsitry" element={<CircleMinistry />} /> {/* Typo redirect */}
                
                {/* Legal routes */}
                <Route path="/legal/terms" element={<TermsOfService />} />
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/cookies" element={<CookiePolicy />} />
                <Route path="/legal/buyer-protection" element={<BuyerProtection />} />
                <Route path="/legal/seller-agreement" element={<SellerAgreement />} />
                <Route path="/legal/prohibited-items" element={<ProhibitedItems />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
          </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </SpiritualCoverageProvider>
    </QueryClientProvider>
  </StrictMode>
);