import { useState } from "react";
import { Link } from "react-router-dom";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Marketplace } from "./Marketplace";
import { Academy } from "./Academy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import circleLogoUrl from "@/assets/circle-logo.png";
import { CartProvider } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"marketplace" | "academy">("marketplace");
  const { user, profile } = useAuth();

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={circleLogoUrl} 
                  alt="Circle Logo" 
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold">Circle</h1>
                  <p className="text-sm text-muted-foreground">Grow Smarter</p>
                </div>
              </div>
              
              {/* Navigation Tabs in Center */}
              <div className="flex-1 flex justify-center">
                <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
              
              <div className="flex items-center gap-4">
                {/* Cart Button - only show on marketplace */}
                {activeTab === "marketplace" && (
                  <CartDrawer />
                )}
                
                {/* Show Circle Points for authenticated users */}
                {user && profile && (
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{profile.circle_points}</span>
                    <span className="text-muted-foreground">Points</span>
                  </div>
                )}
                
                {/* Pro upgrade button for non-pro users */}
                {user && profile && !profile.is_pro_member && (
                  <Button asChild className="bg-circle-accent hover:bg-circle-accent/90 text-foreground">
                    <Link to="/pricing">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Link>
                  </Button>
                )}
                
                {/* Pro badge for pro users */}
                {user && profile?.is_pro_member && (
                  <Badge variant="secondary" className="bg-circle-accent text-foreground">
                    <Crown className="w-4 h-4 mr-1" />
                    Circle Pro
                  </Badge>
                )}
                
                {/* User menu or sign in button */}
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {activeTab === "marketplace" ? <Marketplace /> : <Academy />}
        </main>

        {/* Footer */}
        <footer className="border-t bg-card/50 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-muted-foreground">
              <p>&copy; 2024 Circle. Empowering real estate professionals to grow smarter.</p>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
};

export default Index;
