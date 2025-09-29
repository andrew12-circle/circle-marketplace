import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WebAnalyticsTracker } from "@/components/analytics/WebAnalyticsTracker";

// Lazy load pages for better performance
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Health = lazy(() => import("./pages/Health"));
const FunnelPage = lazy(() => import("./pages/FunnelPage"));
const LenderMarketplace = lazy(() => import("./pages/LenderMarketplace"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Router>
            <WebAnalyticsTracker />
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Index />} />
                <Route path="/lender" element={<LenderMarketplace />} /> {/* Lender marketplace route */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/health" element={<Health />} />
                <Route path="/funnel/:serviceId" element={<FunnelPage />} />
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;