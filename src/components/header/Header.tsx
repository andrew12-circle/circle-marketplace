import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MobileNavigation } from "./MobileNavigation";
import { DesktopNavigation } from "./DesktopNavigation";
import { HeaderActions } from "./HeaderActions";

const circleLogoUrl = "/lovable-uploads/97692497-6d98-46a8-b6fc-05cd68bdc160.png";

export const Header = () => {
  const { user, profile } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50 safe-area-top">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo - Enhanced mobile scaling */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img 
              src={circleLogoUrl}
              alt="Circle Logo" 
              className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 object-contain"
              style={{
                imageRendering: 'crisp-edges'
              }}
            />
          </div>
          
          {/* Desktop Navigation */}
          <DesktopNavigation currentPath={location.pathname} />
          
          {/* Mobile Navigation */}
          <MobileNavigation currentPath={location.pathname} />
          
          {/* Header Actions */}
          <HeaderActions 
            user={user} 
            profile={profile} 
            currentPath={location.pathname} 
          />
        </div>
      </div>
    </header>
  );
};