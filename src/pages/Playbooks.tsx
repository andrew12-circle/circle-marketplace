import { PlaybooksLibrary } from "@/components/playbooks/PlaybooksLibrary";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, BookOpen, Crown } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { LegalFooter } from "@/components/LegalFooter";

const circleLogoUrl = "/circle-logo-updated.png";

const Playbooks = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <ErrorBoundary section="Playbooks">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            {isMobile ? (
              // Mobile Header Layout
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={circleLogoUrl}
                      alt="Circle Logo" 
                      className="w-14 h-14 object-contain"
                      width="56"
                      height="56"
                      loading="eager"
                      decoding="async"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user && profile && (
                      <Link to="/wallet" className="flex items-center gap-1 text-xs hover:bg-accent hover:text-accent-foreground rounded-md px-1.5 py-1 transition-colors cursor-pointer">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="font-medium text-xs" key={profile.circle_points}>{profile.circle_points}</span>
                      </Link>
                    )}
                    <UserMenu />
                  </div>
                </div>
                
                {/* Mobile Navigation Buttons */}
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/" className="gap-2">
                      <Store className="w-4 h-4" />
                      Marketplace
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="sm" className="flex-1">
                    <Link to="/playbooks" className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      Playbooks
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              // Desktop Header Layout
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img 
                    src={circleLogoUrl}
                    alt="Circle Logo" 
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    width="80"
                    height="80"
                    loading="eager"
                    decoding="async"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                
                {/* Navigation */}
                <div className="flex flex-1 justify-center items-center gap-4">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/" className="gap-2">
                      <Store className="w-4 h-4" />
                      Marketplace
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="sm">
                    <Link to="/playbooks" className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      Playbooks
                    </Link>
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <LanguageSwitcher />
                  <LocationSwitcher />
                  
                  {user && profile && (
                    <Link to="/wallet" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground rounded-md px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                      <span className="font-medium" key={profile.circle_points}>{profile.circle_points}</span>
                      <span className="text-muted-foreground hidden sm:inline">Points</span>
                    </Link>
                  )}
                  
                  {user && profile && !profile.is_pro_member && (
                    <Button asChild variant="secondary" className="bg-gradient-to-r from-circle-primary to-circle-primary border-none text-white hover:from-circle-primary/90 hover:to-circle-primary/90 shadow-lg text-xs sm:text-sm px-2 sm:px-4">
                      <Link to="/pricing">
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Upgrade to </span>Pro
                      </Link>
                    </Button>
                  )}
                  
                  <UserMenu />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="space-y-4 w-full max-w-4xl px-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-96 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <PlaybooksLibrary />
          </Suspense>
        </main>

        <LegalFooter />
      </div>
    </ErrorBoundary>
  );
};

export default Playbooks;
