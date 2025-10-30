import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  ShoppingBag,
  Crown,
  LogOut,
  Loader2,
  Heart,
  BarChart3,
  Shield,
  Store,
  Briefcase,
  Package,
  Brain,
  Command,
  DollarSign,
} from "lucide-react";
import { CustomerPortalButton } from "@/components/marketplace/CustomerPortalButton";

interface MobileProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorInfo {
  enabled: boolean;
  type: string;
  company_name: string;
}

export const MobileProfileSheet = ({ open, onOpenChange }: MobileProfileSheetProps) => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { data: isAdmin } = useAdminStatus();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);

  useEffect(() => {
    if (profile) {
      const profileData = profile as any;
      if (profileData.vendor_enabled) {
        setVendorInfo({
          enabled: true,
          type: profileData.vendor_type || "service_provider",
          company_name: profileData.vendor_company_name || profileData.business_name || "",
        });
      } else {
        setVendorInfo(null);
      }
    }
  }, [profile]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
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
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
      window.location.href = "/auth";
    }
  };

  if (!user) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[40vh]">
          <SheetHeader>
            <SheetTitle>Get Started</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-muted-foreground text-center">
              Sign in to access your profile and more features
            </p>
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link to="/auth?mode=signup">Get Started Free</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : user.email?.[0]?.toUpperCase() || "U";

  const MenuItem = ({ to, icon: Icon, children, onClick }: any) => {
    const content = (
      <div className="flex items-center w-full py-3 px-4 hover:bg-accent rounded-md transition-colors">
        <Icon className="mr-3 h-5 w-5" />
        <span>{children}</span>
      </div>
    );

    if (onClick) {
      return (
        <button onClick={onClick} className="w-full text-left">
          {content}
        </button>
      );
    }

    return (
      <Link to={to} onClick={() => onOpenChange(false)} className="block">
        {content}
      </Link>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar className={`h-16 w-16 ${profile?.is_pro_member ? "ring-2 ring-circle-accent ring-offset-2" : ""}`}>
              <AvatarImage
                src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                alt={profile?.display_name || "User"}
              />
              <AvatarFallback className="bg-circle-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-left">
                {profile?.display_name || user.email}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {profile?.business_name && (
                <p className="text-sm text-muted-foreground">{profile.business_name}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-2">
          {/* Circle Points */}
          <Link
            to="/wallet"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-between py-3 px-4 bg-accent rounded-md"
          >
            <div className="flex items-center">
              <Crown className="mr-3 h-5 w-5 text-yellow-500" />
              <span>Circle Points</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {profile?.circle_points || 0}
            </Badge>
          </Link>

          {/* Pro Status */}
          {profile?.is_pro_member && (
            <div className="flex items-center py-3 px-4 bg-accent rounded-md">
              <Crown className="mr-3 h-5 w-5 text-circle-accent" />
              <span>Circle Pro Member</span>
            </div>
          )}

          <Separator className="my-4" />

          {/* Creator Dashboard */}
          {profile?.is_creator ? (
            <MenuItem to="/creator-dashboard" icon={BarChart3}>
              Creator Dashboard
            </MenuItem>
          ) : (
            <MenuItem to="/creator-onboarding" icon={Briefcase}>
              Become a Creator
            </MenuItem>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <MenuItem to="/admin" icon={Shield}>
              Admin Dashboard
            </MenuItem>
          )}

          {/* Vendor Dashboards */}
          {vendorInfo && (
            <>
              <MenuItem to="/vendor-analytics" icon={vendorInfo.type === "co_marketing" ? Briefcase : Store}>
                {vendorInfo.type === "co_marketing" ? "Co-Marketing" : "Vendor"} Dashboard
              </MenuItem>
              <MenuItem to="/vendor-dashboard" icon={Package}>
                Service Management
              </MenuItem>
            </>
          )}

          <Separator className="my-4" />

          {/* Main Menu Items */}
          <MenuItem to="/command-center" icon={Command}>
            Command Center
          </MenuItem>
          <MenuItem to="/ai-dashboard" icon={Brain}>
            AI Concierge
          </MenuItem>
          <MenuItem to="/profile-settings" icon={User}>
            Profile Settings
          </MenuItem>
          <MenuItem to="/orders" icon={ShoppingBag}>
            Order History
          </MenuItem>
          <MenuItem to="/saved" icon={Heart}>
            Saved Services
          </MenuItem>

          {/* Customer Portal */}
          <div className="py-3 px-4">
            <CustomerPortalButton />
          </div>

          <Separator className="my-4" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center w-full py-3 px-4 hover:bg-accent rounded-md transition-colors text-red-600"
          >
            {isSigningOut ? (
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="mr-3 h-5 w-5" />
            )}
            <span>Sign out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
