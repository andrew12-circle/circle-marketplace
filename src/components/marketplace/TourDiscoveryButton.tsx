import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, BookOpen } from 'lucide-react';
import { GuideTour } from '@/components/help/GuideTour';
import { guides } from '@/components/help/guides';

export const TourDiscoveryButton: React.FC = () => {
  const [activeTour, setActiveTour] = useState<typeof guides[0] | null>(null);

  const handleStartQuickTour = () => {
    const marketplaceTour = guides.find(g => g.id === 'marketplace-first-service');
    if (marketplaceTour) {
      setActiveTour(marketplaceTour);
    }
  };

  const handleEndTour = () => {
    setActiveTour(null);
  };

  return null;
  
  // Temporarily disabled - will rebuild later
  /*
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleStartQuickTour}
        className="h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        <Play className="w-3 h-3 mr-1" />
        Take a 60-sec tour
      </Button>

      {activeTour && (
        <GuideTour
          guide={activeTour}
          onComplete={handleEndTour}
          onSkip={handleEndTour}
        />
      )}
    </>
  );
  */
};