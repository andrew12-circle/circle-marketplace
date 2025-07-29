import { Button } from "@/components/ui/button";

interface NavigationTabsProps {
  activeTab: "marketplace" | "academy";
  onTabChange: (tab: "marketplace" | "academy") => void;
}

export const NavigationTabs = ({ activeTab, onTabChange }: NavigationTabsProps) => {
  return (
    <div className="flex bg-circle-neutral rounded-lg p-1 w-fit mx-auto">
      <Button
        variant={activeTab === "marketplace" ? "default" : "ghost"}
        onClick={() => onTabChange("marketplace")}
        className={`rounded-md transition-all ${
          activeTab === "marketplace" 
            ? "bg-circle-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Marketplace
      </Button>
      <Button
        variant={activeTab === "academy" ? "default" : "ghost"}
        onClick={() => onTabChange("academy")}
        className={`rounded-md transition-all ${
          activeTab === "academy" 
            ? "bg-circle-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Academy
      </Button>
    </div>
  );
};