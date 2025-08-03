import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface MobileNavigationProps {
  currentPath: string;
}

export const MobileNavigation = ({ currentPath }: MobileNavigationProps) => {
  const { t } = useTranslation();

  return (
    <div className="sm:hidden flex-1 px-2 sm:px-4 max-w-sm mx-auto">
      <div className="flex bg-muted/80 backdrop-blur-sm rounded-full p-1 border border-border/50">
        <Link
          to="/"
          className={`flex-1 text-xs py-2.5 px-3 rounded-full font-medium transition-all duration-200 text-center touch-target ${
            currentPath === "/" 
              ? "bg-background text-foreground shadow-sm scale-[1.02]" 
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <span className="block truncate">{t('marketplace')}</span>
        </Link>
        <Link
          to="/academy"
          className={`flex-1 text-xs py-2.5 px-3 rounded-full font-medium transition-all duration-200 text-center touch-target ${
            currentPath === "/academy" 
              ? "bg-background text-foreground shadow-sm scale-[1.02]" 
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <span className="block truncate">{t('academy')}</span>
        </Link>
      </div>
    </div>
  );
};