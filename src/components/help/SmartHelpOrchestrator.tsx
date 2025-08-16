import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHelpContext } from '@/hooks/useHelpContext';
import { GuideTour } from './GuideTour';
import { guides, Guide } from './guides';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, BookOpen, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const SmartHelpOrchestrator: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { context, shouldOfferHelp } = useHelpContext();
  const [activeTour, setActiveTour] = useState<Guide | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [lastNudgeTime, setLastNudgeTime] = useState<number>(0);

  // Get relevant guides for current route
  const relevantGuides = guides.filter(guide => 
    guide.routes.some(route => location.pathname.startsWith(route)) || 
    guide.routes.includes('*')
  );

  const logTourEvent = async (eventType: 'start' | 'complete' | 'skip', guideId: string) => {
    if (!user?.id) return;
    
    try {
      // Log to user activity for now since help_analytics table doesn't exist yet
      console.log('Tour event:', { eventType, guideId, route: location.pathname });
    } catch (error) {
      console.error('Failed to log tour event:', error);
    }
  };

  // Smart nudge logic with debouncing
  useEffect(() => {
    if (!shouldOfferHelp() || activeTour || relevantGuides.length === 0) return;
    
    const currentTime = Date.now();
    const NUDGE_COOLDOWN = 5 * 60 * 1000; // 5 minutes
    
    if (currentTime - lastNudgeTime < NUDGE_COOLDOWN) return;
    
    // Check if we should show a nudge for this route
    const routeKey = `nudge_${location.pathname}`;
    const hasBeenDismissed = dismissedNudges.has(routeKey) || 
      localStorage.getItem(`help_dismissed_${routeKey}`) === 'true';
    
    if (hasBeenDismissed) return;

    // Show nudge after a delay to avoid being intrusive
    const timer = setTimeout(() => {
      setShowNudge(true);
      setLastNudgeTime(currentTime);
    }, 3000);

    return () => clearTimeout(timer);
  }, [context, shouldOfferHelp, activeTour, relevantGuides.length, location.pathname, dismissedNudges, lastNudgeTime]);

  const handleStartTour = (guide: Guide) => {
    setActiveTour(guide);
    setShowNudge(false);
    logTourEvent('start', guide.id);
  };

  const handleTourComplete = () => {
    if (activeTour) {
      logTourEvent('complete', activeTour.id);
    }
    setActiveTour(null);
  };

  const handleTourSkip = () => {
    if (activeTour) {
      logTourEvent('skip', activeTour.id);
    }
    setActiveTour(null);
  };

  const handleDismissNudge = () => {
    const routeKey = `nudge_${location.pathname}`;
    setDismissedNudges(prev => new Set([...prev, routeKey]));
    localStorage.setItem(`help_dismissed_${routeKey}`, 'true');
    setShowNudge(false);
  };

  const getBestGuideForUser = (): Guide | undefined => {
    // Prioritize beginner guides for users who seem stuck
    const beginnerGuides = relevantGuides.filter(g => g.difficulty === 'beginner');
    if (beginnerGuides.length > 0) return beginnerGuides[0];
    
    return relevantGuides[0];
  };

  return (
    <>
      {/* Smart Help Nudge */}
      {showNudge && !activeTour && (
        <div className="fixed bottom-20 right-6 z-40 animate-in slide-in-from-bottom-4">
          <Card className="w-80 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-medium text-sm">Need help getting started?</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissNudge}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                We noticed you might need assistance. Would you like a quick tour?
              </p>
              
              {getBestGuideForUser() && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {getBestGuideForUser()?.estimatedTime} • {getBestGuideForUser()?.difficulty}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartTour(getBestGuideForUser()!)}
                    className="h-7 text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start Tour
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Tour */}
      {activeTour && (
        <GuideTour
          guide={activeTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
};