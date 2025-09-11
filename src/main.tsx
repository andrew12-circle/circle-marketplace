import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpiritualCoverageProvider } from "@/contexts/SpiritualCoverageContext";
import { CartProvider } from "@/contexts/CartContext";
import { cacheManager } from "./utils/cacheManager";
import { globalErrorMonitor } from "./utils/globalErrorMonitor";
import { ReloadReasonBanner } from "./components/common/ReloadReasonBanner";
import { SessionRecoveryBanner } from "./components/auth/SessionRecoveryBanner";
import { CookieConsentBanner } from "./components/legal/CookieConsentBanner";
import { SecurityProvider } from "@/components/security/SecurityEnhancementSystem";
import { ErrorBoundaryWithQA } from "@/components/common/ErrorBoundaryWithQA";
import { removeLegacyAuthCookies, initCookieMonitoring, checkCookieSize, clearAllSupabaseAuthCookies } from "./lib/cookies";
import { reportClientError } from "./utils/errorReporting";
import "./utils/pageRecovery"; // Initialize page recovery
import "./lib/console-filter"; // Initialize console filtering for extension noise
import "./lib/analytics/posthog-throttle"; // Initialize PostHog rate limiting
import "./utils/supabaseAuthInterceptor"; // Initialize auth error handling
// Remove the old auth-bootstrap import - using new system
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
const Admin = lazy(() => import("./pages/Admin"));
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

// Additional pages from App.tsx
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const SupportDashboard = lazy(() => import("./pages/SupportDashboard"));
const AdvancedFeaturesDashboard = lazy(() => import("./pages/AdvancedFeaturesDashboard"));
const AIDashboard = lazy(() => import("./pages/AIDashboard"));
const AdminAccounting = lazy(() => import("./pages/AdminAccounting").then(m => ({ default: m.AdminAccounting })));
const AdminCommissions = lazy(() => import("./pages/AdminCommissions"));
const CreatorOnboardingPage = lazy(() => import("./pages/CreatorOnboarding"));
const Welcome = lazy(() => import("./pages/Welcome"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const AgentQuestionnairePage = lazy(() => import("./pages/AgentQuestionnairePage"));
const PartnerCheckout = lazy(() => import("./pages/PartnerCheckout").then(m => ({ default: m.PartnerCheckout })));
const PartnerPaymentSuccess = lazy(() => import("./pages/PartnerPaymentSuccess").then(m => ({ default: m.PartnerPaymentSuccess })));
const PartnerPaymentCanceled = lazy(() => import("./pages/PartnerPaymentCanceled").then(m => ({ default: m.PartnerPaymentCanceled })));
const AgentPaymentSuccess = lazy(() => import("./pages/AgentPaymentSuccess").then(m => ({ default: m.AgentPaymentSuccess })));
const AgentPaymentCanceled = lazy(() => import("./pages/AgentPaymentCanceled").then(m => ({ default: m.AgentPaymentCanceled })));
const CommandCenterTest = lazy(() => import("./pages/CommandCenterTest").then(m => ({ default: m.CommandCenterTest })));
const QARunner = lazy(() => import("./pages/QARunner").then(m => ({ default: m.QARunner })));

// Affiliate pages
const AffiliateLanding = lazy(() => import("./pages/AffiliateLanding").then(m => ({ default: m.AffiliateLanding })));
const AffiliateApplication = lazy(() => import("./pages/AffiliateApplication").then(m => ({ default: m.AffiliateApplication })));
const AffiliateDashboardPage = lazy(() => import("./pages/AffiliateDashboardPage").then(m => ({ default: m.AffiliateDashboardPage })));

// DISC Test page
const DiscTest = lazy(() => import("./pages/DiscTest"));

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
      refetchOnWindowFocus: false, // CRITICAL: Prevents constant refetching on tab focus
      refetchOnReconnect: true, // Keep this for genuine reconnection
      retry: 2,
      networkMode: 'online',
    },
    mutations: {
      retry: 1, // Fewer mutation retries
    },
  },
});

// Clear cache if version mismatch
cacheManager.checkAndClearCache();

// Initialize global error monitoring
globalErrorMonitor.initialize();

// Initialize asset recovery system (temporarily disabled)
import { assetRecovery } from "./utils/assetRecovery";
assetRecovery.initialize();

// Emergency recovery for fallback loop issues
import "./utils/emergencyRecovery";

// Initialize cookie management for auth optimization (cookies only, not auth keys)
removeLegacyAuthCookies();
initCookieMonitoring();

// Initialize one-time non-Supabase key cleanup
import { clearLegacyNonSupabaseKeys } from "./utils/authCleanup";
clearLegacyNonSupabaseKeys();

// Make utilities available globally for debugging and recovery
if (typeof window !== 'undefined') {
  (window as any).checkCookieSize = checkCookieSize;
  (window as any).removeLegacyAuthCookies = removeLegacyAuthCookies;
  (window as any).clearAllSupabaseAuthCookies = clearAllSupabaseAuthCookies;
  (window as any).reportClientError = reportClientError;
}

// Prevent multiple React roots during hot reload
const rootElement = document.getElementById("root")!;
let root: any;

if (!rootElement.hasAttribute('data-react-root')) {
  root = createRoot(rootElement);
  rootElement.setAttribute('data-react-root', 'true');
  // Store root globally for hot reload
  (window as any).__reactRoot = root;
} else {
  // Get existing root for hot reload
  root = (window as any).__reactRoot;
  if (!root) {
    root = createRoot(rootElement);
    (window as any).__reactRoot = root;
  }
}

root.render(
  <ErrorBoundaryWithQA section="Application Root">
    <QueryClientProvider client={queryClient}>
      <SpiritualCoverageProvider>
          <AuthProvider>
            <BrowserRouter>
              <SecurityProvider>
                <CartProvider>
                  <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/creator-dashboard" element={<CreatorDashboard />} />
                <Route path="/creator-payment-setup" element={<CreatorPaymentSetupPage />} />
                <Route path="/admin/*" element={<Admin />} />
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
                
                <Route path="/legal/terms" element={<TermsOfService />} />
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/cookies" element={<CookiePolicy />} />
                <Route path="/legal/buyer-protection" element={<BuyerProtection />} />
                <Route path="/legal/seller-agreement" element={<SellerAgreement />} />
                <Route path="/legal/prohibited-items" element={<ProhibitedItems />} />
                
                {/* Backward-compatible redirects for legal routes */}
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/seller-agreement" element={<SellerAgreement />} />
                <Route path="/buyer-protection" element={<BuyerProtection />} />
                <Route path="/prohibited-items" element={<ProhibitedItems />} />
                
                {/* Additional routes from App.tsx */}
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/support" element={<SupportDashboard />} />
                <Route path="/advanced-features" element={<AdvancedFeaturesDashboard />} />
                <Route path="/ai-dashboard" element={<AIDashboard />} />
                <Route path="/admin/accounting" element={<AdminAccounting />} />
                <Route path="/admin/commissions" element={<AdminCommissions />} />
                <Route path="/creator-onboarding" element={<CreatorOnboardingPage />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/agent-questionnaire" element={<AgentQuestionnairePage />} />
                <Route path="/partner-checkout/:token" element={<PartnerCheckout />} />
                <Route path="/partner-payment-success" element={<PartnerPaymentSuccess />} />
                <Route path="/partner-payment-canceled" element={<PartnerPaymentCanceled />} />
                <Route path="/agent-payment-success" element={<AgentPaymentSuccess />} />
                <Route path="/agent-payment-canceled" element={<AgentPaymentCanceled />} />
                <Route path="/command-center-test" element={<CommandCenterTest />} />
                <Route path="/qa" element={<QARunner />} />
                
                {/* Affiliate routes */}
                <Route path="/affiliate" element={<AffiliateLanding />} />
                <Route path="/affiliate/apply" element={<AffiliateApplication />} />
                <Route path="/affiliate/dashboard" element={<AffiliateDashboardPage />} />
                
                {/* DISC Test route */}
                <Route path="/disc-test" element={<DiscTest />} />
                
                {/* Profile settings alternate path */}
                <Route path="/profile" element={<ProfileSettings />} />
                
                {/* Payment routes alternate paths */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/canceled" element={<PaymentCanceled />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
                  </Suspense>
            <Toaster />
            <ReloadReasonBanner />
            <SessionRecoveryBanner />
            <CookieConsentBanner />
                </CartProvider>
              </SecurityProvider>
          </BrowserRouter>
        </AuthProvider>
      </SpiritualCoverageProvider>
    </QueryClientProvider>
  </ErrorBoundaryWithQA>
);