import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { MobileProfileSheet } from "./MobileProfileSheet";
import { MobileMoreSheet } from "./MobileMoreSheet";

export const MobileBottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { getCartCount, setIsOpen: setCartOpen } = useCart();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (!isMobile) return null;

  const cartCount = getCartCount();
  const isHomeActive = location.pathname === "/" || location.pathname === "/marketplace";

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
        <div className="flex items-center justify-around h-16 px-4">
          {/* Home */}
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-auto py-2 px-4",
                isHomeActive && "text-primary"
              )}
              aria-label="Home"
              aria-current={isHomeActive ? "page" : undefined}
            >
              <Home className={cn("h-6 w-6", isHomeActive && "fill-primary")} />
              <span className="text-xs">Home</span>
            </Button>
          </Link>

          {/* Profile */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-auto py-2 px-4",
              isProfileOpen && "text-primary"
            )}
            onClick={() => setIsProfileOpen(true)}
            aria-label="Profile"
          >
            <User className={cn("h-6 w-6", isProfileOpen && "fill-primary")} />
            <span className="text-xs">Profile</span>
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center gap-1 h-auto py-2 px-4 relative"
            onClick={() => setCartOpen(true)}
            aria-label={`Cart ${cartCount > 0 ? `with ${cartCount} items` : ""}`}
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </div>
            <span className="text-xs">Cart</span>
          </Button>

          {/* More */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-auto py-2 px-4",
              isMoreOpen && "text-primary"
            )}
            onClick={() => setIsMoreOpen(true)}
            aria-label="More menu"
          >
            <Menu className="h-6 w-6" />
            <span className="text-xs">More</span>
          </Button>
        </div>
      </nav>

      {/* Sheets */}
      <MobileProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <MobileMoreSheet open={isMoreOpen} onOpenChange={setIsMoreOpen} />
    </>
  );
};
