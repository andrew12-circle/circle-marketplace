import { Button } from "@/components/ui/button";

interface NavigationTabsProps {
  activeTab: "marketplace" | "academy";
  onTabChange: (tab: "marketplace" | "academy") => void;
}

export const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  return (
    <div className="flex bg-muted/50 rounded-xl p-1 w-fit mx-auto backdrop-blur-sm border border-border/50">
      <Button
        variant="ghost"
        onClick={() => onTabChange("marketplace")}
        className={`rounded-lg px-6 py-2 font-medium transition-all duration-200 ${
          activeTab === "marketplace" 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}
      >
        Marketplace
      </Button>
      <Button
        variant="ghost"
        onClick={() => onTabChange("academy")}
        className={`rounded-lg px-6 py-2 font-medium transition-all duration-200 ${
          activeTab === "academy" 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}
      >
        Academy
      </Button>
    </div>
  );
};