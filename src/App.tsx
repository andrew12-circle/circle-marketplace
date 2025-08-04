import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { CSRFProvider } from "@/components/common/CSRFProtection";
import { SecurityHeaders } from "@/components/common/SecurityHeaders";
import { EnhancedSecurityHeaders } from "@/components/security/EnhancedSecurityHeaders";
import { SecurityStatusIndicator } from "@/components/security/SecurityEnhancementSystem";
import RequestLogger from "@/components/security/RequestLogger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
  },
});

const App = () => {
  console.log("App component rendering");
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
              <SecurityHeaders />
              <EnhancedSecurityHeaders />
              <RequestLogger />
            </AuthProvider>
          </CSRFProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;