import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { UserMenu } from "@/components/UserMenu";

interface HeaderActionsProps {
  user: any;
  profile: any;
  currentPath: string;
}

export const HeaderActions = ({ user, profile, currentPath }: HeaderActionsProps) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
      {/* Language & Location Switchers - Progressive disclosure */}
      <div className="hidden xs:flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <LocationSwitcher />
      </div>
      
      {/* Cart Button - only show on marketplace with better mobile sizing */}
      {currentPath === "/" && (
        <div className="flex items-center">
          <CartDrawer />
        </div>
      )}
      
      {/* Circle Points - Enhanced mobile layout */}
      {user && profile && (
        <Link 
          to="/wallet" 
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-1.5 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer touch-target min-w-0 min-h-[44px] sm:min-h-0"
        >
          <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
          <span className="font-medium truncate">{profile.circle_points}</span>
          <span className="text-muted-foreground hidden lg:inline whitespace-nowrap">Points</span>
        </Link>
      )}
      
      {/* Pro upgrade button - Smart responsive visibility */}
      {user && profile && !profile.is_pro_member && (
        <Button 
          asChild 
          variant="secondary" 
          size="sm"
          className="hidden md:flex bg-gradient-to-r from-circle-primary to-circle-primary border-none text-white hover:from-circle-primary/90 hover:to-circle-primary/90 shadow-lg text-xs sm:text-sm touch-target min-h-[44px] sm:min-h-0"
        >
          <Link to="/pricing" className="flex items-center gap-1 sm:gap-2">
            <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Upgrade to</span>
            <span>Pro</span>
          </Link>
        </Button>
      )}
      
      {/* User menu */}
      <UserMenu />
    </div>
  );
};