
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SpiritualCoverageProvider } from "@/contexts/SpiritualCoverageContext";
import { useFunnelEvents } from "@/hooks/useFunnelEvents";

// Import pages - using named imports where needed
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { Marketplace } from "@/pages/Marketplace";
import { Academy } from "@/pages/Academy";
import Pricing from "@/pages/Pricing";
import { ProfileSettings } from "@/pages/ProfileSettings";
import AdminDashboard from "@/pages/AdminDashboard";
import CommandCenter from "@/pages/CommandCenter";
import PaymentSuccess from "@/pages/PaymentSuccess";
import { PaymentCanceled } from "@/pages/PaymentCanceled";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Component to initialize funnel tracking
const FunnelTracker = () => {
  useFunnelEvents();
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <SpiritualCoverageProvider>
              <CartProvider>
                <FunnelTracker />
                <div className="min-h-screen bg-background font-sans antialiased">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/academy" element={<Academy />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/profile" element={<ProfileSettings />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/command-center" element={<CommandCenter />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/payment-canceled" element={<PaymentCanceled />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <Toaster />
                <Sonner />
              </CartProvider>
            </SpiritualCoverageProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
