import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Marketplace } from "./Marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
const circleLogoUrl = "/circle-logo-updated.png";

import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";
import { FirstVisitIntro } from "@/components/marketing/FirstVisitIntro";
import { OnboardingResumeBanner } from "@/components/onboarding/OnboardingResumeBanner";
import { SmartHelpOrchestrator } from "@/components/help/SmartHelpOrchestrator";
import { EnhancedHelpWidget } from "@/components/help/EnhancedHelpWidget";
import { Building, Store, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
        {/* Mobile-Optimized Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            {isMobile ? (
              // Mobile Header Layout
              <div className="space-y-3">
                {/* Top row - Logo and User Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={circleLogoUrl}
                      alt="Circle Logo" 
                      className="w-10 h-10 object-contain"
                      width="40"
                      height="40"
                      loading="eager"
                      decoding="async"
                      style={{
                        imageRendering: 'crisp-edges'
                      }}
                    />
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
                <div className="flex justify-center">
                  <div className="flex bg-muted rounded-full p-1 w-full max-w-xs">
                    <Link
                      to="/"
                      data-tour="marketplace-tab"
                      className={`flex-1 text-xs py-1.5 px-3 rounded-full font-medium transition-all text-center ${
                        location.pathname === "/" 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground"
                      }`}
                    >
                      {t('marketplace')}
                    </Link>
                    <Link
                      to="/academy"
                      data-tour="academy-tab"
                      className={`flex-1 text-xs py-1.5 px-3 rounded-full font-medium transition-all text-center ${
                        location.pathname === "/academy" 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground"
                      }`}
                    >
                      {t('academy')}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              // Desktop Header Layout (unchanged)
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <img 
                    src={circleLogoUrl}
                    alt="Circle Logo" 
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    width="80"
                    height="80"
                    loading="eager"
                    decoding="async"
                    
                    style={{
                      imageRendering: 'crisp-edges'
                    }}
                  />
                </div>
                
                {/* Navigation Tabs - Desktop */}
                <div className="flex flex-1 justify-center">
                  <NavigationTabs activeTab="marketplace" />
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Language & Location Switchers */}
                  <LanguageSwitcher />
                  <LocationSwitcher />
                  
                  {/* Cart Button - only show on marketplace */}
                  {location.pathname === "/" && (
                    <CartDrawer />
                  )}
                  
                  {/* Circle Points - Desktop */}
                  {user && profile && (
                    <Link to="/wallet" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer touch-target">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                      <span className="font-medium">{profile.circle_points}</span>
                      <span className="text-muted-foreground hidden sm:inline">Points</span>
                    </Link>
                  )}
                  
                  {/* Pro upgrade button */}
                  {user && profile && !profile.is_pro_member && (
                    <Button asChild variant="secondary" className="bg-gradient-to-r from-circle-primary to-circle-primary border-none text-white hover:from-circle-primary/90 hover:to-circle-primary/90 shadow-lg text-xs sm:text-sm">
                      <Link to="/pricing">
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden md:inline">Upgrade to</span> Pro
                      </Link>
                    </Button>
                  )}
                  
                  {/* User menu */}
                  <UserMenu />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main>
          {/* Onboarding Resume Banner */}
          <div className="container mx-auto px-3 sm:px-4 pt-6">
            <OnboardingResumeBanner />
          </div>
          
          <Marketplace />
        </main>

        {/* Legal Footer */}
        <LegalFooter />
        
        {/* First Visit Intro Modal */}
        <FirstVisitIntro />
        
        {/* Smart Help System */}
        <SmartHelpOrchestrator />
        <EnhancedHelpWidget />
      </div>
    );
};

export default Index;
