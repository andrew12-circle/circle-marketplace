import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { User, Settings, ShoppingBag, Crown, LogOut, Loader2, Heart, BarChart3, Shield, Building2, DollarSign, Store, Briefcase, Package, Brain, Command } from "lucide-react";
import { CustomerPortalButton } from "@/components/marketplace/CustomerPortalButton";


interface VendorInfo {
  enabled: boolean;
  type: string;
  company_name: string;
}

export const UserMenu = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  

  // Check vendor info from profile
  useEffect(() => {
    if (profile) {
      const profileData = profile as any;
      if (profileData.vendor_enabled) {
        setVendorInfo({
          enabled: true,
          type: profileData.vendor_type || 'service_provider',
          company_name: profileData.vendor_company_name || profileData.business_name || ''
        });
      } else {
        setVendorInfo(null);
      }
    }
  }, [profile]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await signOut();
    
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    }
    setIsSigningOut(false);
  };

  if (!user) {
    return (
      <Button asChild variant="outline" className="min-h-[44px] sm:min-h-0 px-4 py-2 text-sm touch-target">
        <Link to="/auth">Sign In</Link>
      </Button>
    );
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button variant="ghost" className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full touch-target min-h-[44px] sm:min-h-0">
            <Avatar className={`h-10 w-10 ${profile?.is_pro_member ? 'ring-2 ring-circle-accent ring-offset-2 ring-offset-background' : ''}`}>
              <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'User'} />
              <AvatarFallback className="bg-circle-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
          {/* Pro indicator below avatar */}
          {profile?.is_pro_member && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <Badge variant="secondary" className="bg-circle-accent text-foreground text-[10px] px-1 py-0 h-4 min-w-0">
                <Crown className="w-2 h-2 mr-0.5" />
                PRO
              </Badge>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.display_name || user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {profile?.business_name && (
              <p className="text-xs leading-none text-muted-foreground">
                {profile.business_name}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Circle Points Display */}
        <DropdownMenuItem asChild>
          <Link to="/wallet" className="flex items-center justify-between">
            <span className="flex items-center">
              <Crown className="mr-2 h-4 w-4 text-yellow-500" />
              Circle Points
            </span>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {profile?.circle_points || 0}
            </Badge>
          </Link>
        </DropdownMenuItem>
        
        {/* Pro Status */}
        {profile?.is_pro_member && (
          <DropdownMenuItem>
            <Crown className="mr-2 h-4 w-4 text-circle-accent" />
            <span>Circle Pro Member</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Creator Dashboard Link */}
        {profile?.is_creator && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/creator-dashboard" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Creator Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Admin Dashboard Link */}
        {profile?.is_admin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

         {/* Vendor Dashboard Link */}
         {vendorInfo && (
           <>
              <DropdownMenuItem asChild>
                <Link to="/vendor-analytics" className="flex items-center">
                  {vendorInfo.type === 'co_marketing' ? (
                    <Briefcase className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Store className="mr-2 h-4 w-4 text-blue-600" />
                  )}
                  <span>
                    {vendorInfo.type === 'co_marketing' ? 'Co-Marketing' : 'Vendor'} Dashboard
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/vendor-dashboard" className="flex items-center">
                  <Package className="mr-2 h-4 w-4 text-purple-600" />
                  <span>Service Management</span>
                </Link>
              </DropdownMenuItem>
             <DropdownMenuSeparator />
           </>
         )}
        
        <DropdownMenuSeparator />
        
        {/* Command Center Link */}
        <DropdownMenuItem asChild>
          <Link to="/command-center" className="flex items-center">
            <Command className="mr-2 h-4 w-4 text-primary" />
            <span>Command Center</span>
          </Link>
        </DropdownMenuItem>
        
        {/* AI Dashboard Link */}
        <DropdownMenuItem asChild>
          <Link to="/ai-dashboard" className="flex items-center">
            <Brain className="mr-2 h-4 w-4 text-primary" />
            <span>AI Concierge</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/profile-settings" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/orders" className="flex items-center">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>Order History</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/saved" className="flex items-center">
            <Heart className="mr-2 h-4 w-4" />
            <span>Saved Services</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Customer Portal Button */}
        <DropdownMenuItem asChild>
          <CustomerPortalButton />
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-red-600 focus:text-red-600"
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      
    </DropdownMenu>
  );
};