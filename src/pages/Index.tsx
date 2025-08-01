import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Marketplace } from "./Marketplace";
import { Academy } from "./Academy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
const circleLogoUrl = "/lovable-uploads/97692497-6d98-46a8-b6fc-05cd68bdc160.png";
import { CartProvider } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";
import { Building, Store } from "lucide-react";
import { CustomerPortalButton } from "@/components/marketplace/CustomerPortalButton";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"marketplace" | "academy">("marketplace");
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile-Optimized Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src={circleLogoUrl}
                  alt="Circle Logo" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  style={{
                    imageRendering: 'crisp-edges'
                  }}
                />
              </div>
              
              {/* Navigation Tabs - Responsive */}
              <div className="hidden sm:flex flex-1 justify-center">
                <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
              
              {/* Mobile Navigation Tabs */}
              <div className="sm:hidden flex-1 px-4">
                <div className="flex bg-muted rounded-full p-1">
                  <button
                    onClick={() => setActiveTab("marketplace")}
                    className={`flex-1 text-xs py-2 px-3 rounded-full font-medium transition-all ${
                      activeTab === "marketplace" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground"
                    }`}
                  >
                    {t('marketplace').substring(0, 6)}
                  </button>
                  <button
                    onClick={() => setActiveTab("academy")}
                    className={`flex-1 text-xs py-2 px-3 rounded-full font-medium transition-all ${
                      activeTab === "academy" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground"
                    }`}
                  >
                    {t('academy')}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Language & Location Switchers */}
                <LanguageSwitcher />
                <LocationSwitcher />
                
                {/* Cart Button - only show on marketplace */}
                {activeTab === "marketplace" && (
                  <CartDrawer />
                )}
                
                {/* Circle Points - Mobile Optimized */}
                {user && profile && (
                  <Link to="/wallet" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer touch-target">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    <span className="font-medium">{profile.circle_points}</span>
                    <span className="text-muted-foreground hidden sm:inline">Points</span>
                  </Link>
                )}
                
                {/* Customer Portal Button */}
                {user && profile && (
                  <div className="hidden sm:block">
                    <CustomerPortalButton />
                  </div>
                )}
                
                {/* Pro upgrade button - hidden on small mobile */}
                {user && profile && !profile.is_pro_member && (
                  <Button asChild variant="secondary" className="hidden sm:flex bg-gradient-to-r from-circle-primary to-circle-primary border-none text-white hover:from-circle-primary/90 hover:to-circle-primary/90 shadow-lg text-xs sm:text-sm">
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
          </div>
        </header>

        {/* Main Content */}
        <main>
          {activeTab === "marketplace" ? <Marketplace /> : <Academy />}
        </main>

        {/* Legal Footer */}
        <LegalFooter />
      </div>
    </CartProvider>
  );
};

export default Index;
