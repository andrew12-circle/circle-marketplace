import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

interface NavigationTabsProps {
  activeTab?: "marketplace" | "academy";
  onTabChange?: (tab: "marketplace" | "academy") => void;
}

export const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Determine active tab from URL if not provided
  const currentTab = activeTab || (
    location.pathname === "/academy" ? "academy" :
    "marketplace"
  );
  return (
    <div className="flex bg-muted/50 rounded-xl p-1 w-fit mx-auto backdrop-blur-sm border border-border/50">
      <Button
        asChild
        variant="ghost"
        data-tour="marketplace-tab"
        className={`rounded-lg px-6 py-2 font-medium transition-all duration-200 ${
          currentTab === "marketplace" 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}
      >
        <Link to="/">{t('marketplace')}</Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        data-tour="academy-tab"
        className={`rounded-lg px-6 py-2 font-medium transition-all duration-200 ${
          currentTab === "academy" 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}
      >
        <Link to="/academy">{t('academy')}</Link>
      </Button>
    </div>
  );
};