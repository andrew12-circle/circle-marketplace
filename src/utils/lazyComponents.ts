import { lazy } from 'react';

// Lazy load heavy components with optimized imports
export const LazyMarketplace = lazy(() => 
  import('../pages/Marketplace').then(module => ({
    default: module.Marketplace
  }))
);

export const LazyAcademy = lazy(() =>
  import('../pages/Academy').then(module => ({
    default: module.Academy
  }))
);

export const LazyCreatorDashboard = lazy(() =>
  import('../pages/CreatorDashboard').then(module => ({
    default: module.CreatorDashboard
  }))
);

export const LazyAdminDashboard = lazy(() =>
  import('../pages/AdminDashboard')
);

export const LazyProfileSettings = lazy(() =>
  import('../pages/ProfileSettings').then(module => ({
    default: module.ProfileSettings
  }))
);

export const LazyOrderHistory = lazy(() =>
  import('../pages/OrderHistory').then(module => ({
    default: module.OrderHistory
  }))
);

export const LazyAgentWallet = lazy(() =>
  import('../pages/AgentWallet').then(module => ({
    default: module.AgentWallet
  }))
);

export const LazyVendorDashboard = lazy(() =>
  import('../pages/VendorDashboard').then(module => ({
    default: module.VendorDashboard
  }))
);

// Heavy interactive components
export const LazyEnhancedHelpWidget = lazy(() =>
  import('../components/help/EnhancedHelpWidget').then(module => ({
    default: module.EnhancedHelpWidget
  }))
);

export const LazySmartHelpOrchestrator = lazy(() =>
  import('../components/help/SmartHelpOrchestrator').then(module => ({
    default: module.SmartHelpOrchestrator
  }))
);

export const LazyProactiveHelpMonitor = lazy(() =>
  import('../components/help/ProactiveHelpMonitor').then(module => ({
    default: module.ProactiveHelpMonitor
  }))
);

export const LazyFirstVisitIntro = lazy(() =>
  import('../components/marketing/FirstVisitIntro').then(module => ({
    default: module.FirstVisitIntro
  }))
);