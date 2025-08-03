import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toaster";
import { suppressConsoleLogs } from "./utils/performance";
import { initializePerformanceOptimizations } from "./utils/advancedPerformance";
import { initializePerformanceOptimizations as initConsoleCleanup } from "./utils/consoleCleanup";
import App from "./App";
import "./index.css";
import "./i18n";

// Initialize performance optimizations immediately
suppressConsoleLogs();
initConsoleCleanup();

// Initialize advanced performance features
initializePerformanceOptimizations().catch(error => {
  console.warn('Performance optimization init failed:', error);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>
);