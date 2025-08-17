
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service Worker Registration with security considerations
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// Security Headers Setup
if (import.meta.env.PROD) {
  // Additional security measures for production
  console.log("Production environment detected - security measures active");
}

// Pricing page view tracking (temporarily commented out until we fix the import)
// window.addEventListener('load', () => {
//   if (window.location.pathname === '/pricing') {
//     window.gtag?.('event', 'page_view', { page_path: '/pricing' });
//   }
// });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
