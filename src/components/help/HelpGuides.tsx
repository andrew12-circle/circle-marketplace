import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Users, Zap } from 'lucide-react';
import { guides, Guide } from './guides';
import { GuideTour } from './GuideTour';

interface HelpGuidesProps {
  currentRoute: string;
}

export const HelpGuides: React.FC<HelpGuidesProps> = ({ currentRoute }) => {
  const [activeTour, setActiveTour] = useState<Guide | null>(null);

  // Get context-aware guides
  const routeGuides = guides.filter(guide => 
    guide.routes.some(route => currentRoute.startsWith(route)) || 
    guide.routes.includes('*')
  );

  const handleStartTour = (guide: Guide) => {
    setActiveTour(guide);
  };

  const handleEndTour = () => {
    setActiveTour(null);
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Users className="w-3 h-3" />;
      case 'intermediate':
        return <Clock className="w-3 h-3" />;
      case 'advanced':
        return <Zap className="w-3 h-3" />;
      default:
        return <Play className="w-3 h-3" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <ScrollArea className="flex-1 p-3">
          {routeGuides.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No guides available for this page.
            </div>
          ) : (
            <div className="space-y-3">
              {routeGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{guide.title}</h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getDifficultyColor(guide.difficulty)}`}
                    >
                      {getDifficultyIcon(guide.difficulty)}
                      <span className="ml-1 capitalize">{guide.difficulty}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {guide.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{guide.estimatedTime}</span>
                      <span className="mx-1">•</span>
                      <span>{guide.steps.length} steps</span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleStartTour(guide)}
                      className="h-7 text-xs"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Guide Tour Overlay */}
      {activeTour && (
        <GuideTour
          guide={activeTour}
          onComplete={handleEndTour}
          onSkip={handleEndTour}
        />
      )}
    </>
  );
};