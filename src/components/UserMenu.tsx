import { useState } from "react";
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
import { useLocation } from "@/hooks/useLocation";
import { User, Settings, ShoppingBag, Crown, LogOut, Loader2, MapPin, Heart, BarChart3 } from "lucide-react";

export const UserMenu = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { location } = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
      <Button asChild variant="outline">
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
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'User'} />
            <AvatarFallback className="bg-circle-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
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
            {location && (
              <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location.city}, {location.state}
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
        
        <DropdownMenuSeparator />
        
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