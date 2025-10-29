import { Link, useLocation } from "react-router-dom";
import { PlaybooksLibrary } from "@/components/playbooks/PlaybooksLibrary";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";
import { Button } from "@/components/ui/button";
import { Crown, Store, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const circleLogoUrl = "/circle-logo-updated.png";

const Playbooks = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                    className="w-14 h-14 object-contain"
                    width="56"
                    height="56"
                    loading="eager"
                    decoding="async"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  {location.pathname === "/" && <CartDrawer />}
                  
                  {user && profile && (
                    <Link to="/wallet" className="flex items-center gap-1 text-xs hover:bg-accent hover:text-accent-foreground rounded-md px-1.5 py-1 transition-colors cursor-pointer touch-target">
                      <Crown className="w-3 h-3 text-yellow-500" />
                      <span className="font-medium text-xs" key={profile.circle_points}>{profile.circle_points}</span>
                    </Link>
                  )}
                  
                  <UserMenu />
                </div>
              </div>
              
              {/* Mobile Navigation Buttons */}
              <div className="flex gap-2">
                <Button
                  asChild
                  variant={location.pathname === "/" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  <Link to="/" className="gap-2">
                    <Store className="w-4 h-4" />
                    Marketplace
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={location.pathname === "/playbooks" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  <Link to="/playbooks" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Playbooks
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            // Desktop Header Layout
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src={circleLogoUrl}
                  alt="Circle Logo" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  width="80"
                  height="80"
                  loading="eager"
                  decoding="async"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
              
              {/* Center Navigation */}
              <div className="flex flex-1 justify-center items-center gap-4">
                <Button
                  asChild
                  variant={location.pathname === "/" ? "default" : "ghost"}
                  size="sm"
                >
                  <Link to="/" className="gap-2">
                    <Store className="w-4 h-4" />
                    Marketplace
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={location.pathname === "/playbooks" ? "default" : "ghost"}
                  size="sm"
                >
                  <Link to="/playbooks" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Playbooks
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Language & Location Switchers */}
                <LanguageSwitcher />
                <LocationSwitcher />
                
                {/* Cart Button - only show on marketplace */}
                {location.pathname === "/" && <CartDrawer />}
                
                {/* Circle Points - Desktop */}
                {user && profile && (
                  <Link to="/wallet" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer touch-target">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    <span className="font-medium" key={profile.circle_points}>{profile.circle_points}</span>
                    <span className="text-muted-foreground hidden sm:inline">Points</span>
                  </Link>
                )}
                
                {/* Pro upgrade button */}
                {user && profile && !profile.is_pro_member && (
                  <Button asChild variant="secondary" className="bg-gradient-to-r from-circle-primary to-circle-primary border-none text-white hover:from-circle-primary/90 hover:to-circle-primary/90 shadow-lg text-xs sm:text-sm px-2 sm:px-4">
                    <Link to="/pricing">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Upgrade to </span>Pro
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
        <PlaybooksLibrary />
      </main>

      {/* Legal Footer */}
      <LegalFooter />
    </div>
  );
};

export default Playbooks;
