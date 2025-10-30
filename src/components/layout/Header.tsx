import { Link, useLocation } from "react-router-dom";
import { Crown } from "lucide-react";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { TourDiscoveryButton } from "@/components/marketplace/TourDiscoveryButton";
import { useIsMobile } from "@/hooks/use-mobile";

const circleLogoUrl = "/circle-logo-updated.png";

interface HeaderProps {
  showCart?: boolean;
  showTourButton?: boolean;
}

export const Header = ({ showCart = false, showTourButton = false }: HeaderProps) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {isMobile ? (
          // Mobile Header Layout - Simplified (bottom nav handles user actions)
          <div className="flex items-center justify-center">
            <Link to="/">
              <img 
                src={circleLogoUrl}
                alt="Circle Logo" 
                className="w-14 h-14 object-contain"
                width="56"
                height="56"
                loading="eager"
                decoding="async"
                style={{
                  imageRendering: 'crisp-edges'
                }}
              />
            </Link>
          </div>
        ) : (
          // Desktop Header Layout
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/">
                <img 
                  src={circleLogoUrl}
                  alt="Circle Logo" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  width="80"
                  height="80"
                  loading="eager"
                  decoding="async"
                  style={{
                    imageRendering: 'crisp-edges'
                  }}
                />
              </Link>
            </div>
            
            {/* Tour Discovery Button - Desktop */}
            {showTourButton && (
              <div className="flex flex-1 justify-center items-center gap-4">
                <TourDiscoveryButton />
              </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Language & Location Switchers */}
              <div className="hidden sm:flex items-center gap-2">
                <LanguageSwitcher />
                <LocationSwitcher />
              </div>
              
              {/* User Actions */}
              <div className="flex items-center gap-2">
                {showCart && <CartDrawer />}
                
                {user && profile && (
                  <Link to="/wallet" className="flex items-center gap-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 transition-colors">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium" key={profile.circle_points}>{profile.circle_points}</span>
                  </Link>
                )}
                
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};