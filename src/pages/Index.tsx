import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { NavigationTabs } from "@/components/NavigationTabs";
// Lazy load Marketplace to prevent app loading timeout
const Marketplace = React.lazy(() => import("./Marketplace").then(m => ({ default: m.Marketplace })));
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { ResponsiveLogo } from "@/components/ui/optimized-image";
import { CriticalContent, NonCriticalContent, useCriticalResourceHints } from "@/components/ui/critical-content";
import { conditionalLoader } from "@/utils/conditionalLoader";

import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";
// Removed direct import - now using lazy component
import { OnboardingResumeBanner } from "@/components/onboarding/OnboardingResumeBanner";
import { 
  LazySmartHelpOrchestrator, 
  LazyEnhancedHelpWidget, 
  LazyProactiveHelpMonitor,
  LazyFirstVisitIntro 
} from "@/utils/lazyComponents";
import { TourDiscoveryButton } from "@/components/marketplace/TourDiscoveryButton";
import { Building, Store, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Index() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Preload critical resources
  useCriticalResourceHints();

  // Conditionally preload modules based on user behavior
  React.useEffect(() => {
    // Preload charts and forms when user is idle (likely to interact)
    conditionalLoader.preloadOnIdle(['charts', 'forms']);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Critical above-the-fold header */}
      <CriticalContent>
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            {isMobile ? (
              // Mobile Header Layout
              <div className="space-y-3">
                {/* Top row - Logo and User Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ResponsiveLogo className="w-10 h-10" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {location.pathname === "/" && <CartDrawer />}
                    
                    {user && profile && (
                      <Link to="/wallet" className="flex items-center gap-1 text-xs hover:bg-accent hover:text-accent-foreground rounded-md px-1.5 py-1 transition-colors cursor-pointer touch-target">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="font-medium text-xs">{profile.circle_points}</span>
                      </Link>
                    )}
                    
                    <UserMenu />
                  </div>
                </div>
                
                {/* Bottom row - Navigation Tabs */}
                {/* <div className="flex justify-center">
                  <NavigationTabs />
                </div> */}
              </div>
            ) : (
              // Desktop Header Layout
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <ResponsiveLogo className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
                
                {/* Navigation Tabs - Desktop */}
                {/* <div className="flex flex-1 justify-center">
                  <NavigationTabs />
                </div> */}
                
                {/* User Actions - Desktop */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {user && profile && (
                    <Link to="/wallet" className="flex items-center gap-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 transition-colors cursor-pointer">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{profile.circle_points}</span>
                    </Link>
                  )}
                  <LanguageSwitcher />
                  <LocationSwitcher />
                  <CartDrawer />
                  <UserMenu />
                </div>
              </div>
            )}
          </div>
        </header>
      </CriticalContent>

      {/* Main content area */}
      <main className="flex-1">
        {/* Marketplace content with lazy loading - removed CriticalContent wrapper */}
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Marketplace />
        </Suspense>
        
        {/* Non-critical footer content */}
        <NonCriticalContent>
          <OnboardingResumeBanner />
          <LegalFooter />
          <Suspense fallback={null}>
            <LazyFirstVisitIntro />
          </Suspense>
        </NonCriticalContent>
      </main>

      {/* Non-critical interactive elements */}
      <NonCriticalContent>
        <Suspense fallback={null}>
          <LazySmartHelpOrchestrator />
          <LazyEnhancedHelpWidget />
          <LazyProactiveHelpMonitor />
        </Suspense>
      </NonCriticalContent>
    </div>
  );
}
