import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface MobileNavigationProps {
  currentPath: string;
}

export const MobileNavigation = ({ currentPath }: MobileNavigationProps) => {
  const { t } = useTranslation();

  return (
    <div className="sm:hidden flex-1 px-2 max-w-xs mx-auto">
      <div className="flex bg-muted rounded-full p-0.5 shadow-sm">
        <Link
          to="/"
          className={`flex-1 py-2.5 px-3 rounded-full font-medium transition-all duration-200 text-center touch-target flex items-center justify-center min-h-[44px] ${
            currentPath === "/" 
              ? "bg-background text-foreground shadow-sm text-sm" 
              : "text-muted-foreground hover:text-foreground text-sm"
          }`}
        >
          {t('marketplace')}
        </Link>
        <Link
          to="/academy"
          className={`flex-1 py-2.5 px-3 rounded-full font-medium transition-all duration-200 text-center touch-target flex items-center justify-center min-h-[44px] ${
            currentPath === "/academy" 
              ? "bg-background text-foreground shadow-sm text-sm" 
              : "text-muted-foreground hover:text-foreground text-sm"
          }`}
        >
          {t('academy')}
        </Link>
      </div>
    </div>
  );
};