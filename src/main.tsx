import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { suppressConsoleLogs } from "./utils/performance";
import { initializePerformanceOptimizations } from "./utils/advancedPerformance";
import { initializePerformanceOptimizations as initConsoleCleanup } from "./utils/consoleCleanup";
import OptimizedRouter from "./components/OptimizedRouter";
import "./index.css";
import "./i18n";

// Initialize performance optimizations immediately
suppressConsoleLogs();
initConsoleCleanup();

// Enhanced React Query client with optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    }
  }
});

// Initialize advanced performance features
initializePerformanceOptimizations().catch(error => {
  console.warn('Performance optimization init failed:', error);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <OptimizedRouter />
            <Toaster />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);