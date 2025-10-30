import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  Brain,
  BookOpen,
  Building2,
  Users,
  Globe,
  MapPin,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";

interface MobileMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileMoreSheet = ({ open, onOpenChange }: MobileMoreSheetProps) => {
  const MenuItem = ({ to, icon: Icon, children }: any) => (
    <Link
      to={to}
      onClick={() => onOpenChange(false)}
      className="flex items-center py-3 px-4 hover:bg-accent rounded-md transition-colors"
    >
      <Icon className="mr-3 h-5 w-5" />
      <span>{children}</span>
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>More Options</SheetTitle>
        </SheetHeader>

        <div className="space-y-2">
          {/* Main Navigation */}
          <MenuItem to="/command-center" icon={Command}>
            Command Center
          </MenuItem>
          <MenuItem to="/ai-dashboard" icon={Brain}>
            AI Concierge
          </MenuItem>
          <MenuItem to="/playbooks" icon={BookOpen}>
            Playbooks Library
          </MenuItem>
          <MenuItem to="/lender-marketplace" icon={Building2}>
            Lender Marketplace
          </MenuItem>
          <MenuItem to="/lobby" icon={Users}>
            Lobby
          </MenuItem>

          <Separator className="my-4" />

          {/* Settings */}
          <div className="space-y-3 py-2">
            <div className="flex items-center px-4">
              <Globe className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium mr-auto">Language</span>
              <LanguageSwitcher />
            </div>
            <div className="flex items-center px-4">
              <MapPin className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium mr-auto">Location</span>
              <LocationSwitcher />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
