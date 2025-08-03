import { NavigationTabs } from "@/components/NavigationTabs";

interface DesktopNavigationProps {
  currentPath: string;
}

export const DesktopNavigation = ({ currentPath }: DesktopNavigationProps) => {
  const activeTab = currentPath === "/academy" ? "academy" : "marketplace";

  return (
    <div className="hidden sm:flex flex-1 justify-center">
      <NavigationTabs activeTab={activeTab} />
    </div>
  );
};