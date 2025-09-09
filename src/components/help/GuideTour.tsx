import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Guide, GuideStep } from './guides';

interface GuideTourProps {
  guide: Guide;
  onComplete: () => void;
  onSkip: () => void;
}

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const GuideTour: React.FC<GuideTourProps> = ({
  guide,
  onComplete,
  onSkip
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  }>({
    top: 0,
    left: 0
  });
  const [elementNotFound, setElementNotFound] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = guide.steps[currentStepIndex];
  const isLastStep = currentStepIndex === guide.steps.length - 1;
  const progress = (currentStepIndex + 1) / guide.steps.length * 100;

  useEffect(() => {
    const updatePosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (currentStep?.selector) {
        const element = document.querySelector(currentStep.selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          
          // Use fixed positioning - only viewport coordinates
          setTargetPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
          setElementNotFound(false);

          // Calculate tooltip position using viewport coordinates only
          const tooltipWidth = 320;
          const tooltipHeight = 280;
          const padding = 20;
          
          let preferredPosition = currentStep.position || 'bottom';
          
          // Calculate positions for each direction (viewport coordinates)
          const positions = {
            top: {
              top: rect.top - tooltipHeight - 16,
              left: rect.left + rect.width / 2 - tooltipWidth / 2
            },
            bottom: {
              top: rect.top + rect.height + 16,
              left: rect.left + rect.width / 2 - tooltipWidth / 2
            },
            left: {
              top: rect.top + rect.height / 2 - tooltipHeight / 2,
              left: rect.left - tooltipWidth - 16
            },
            right: {
              top: rect.top + rect.height / 2 - tooltipHeight / 2,
              left: rect.left + rect.width + 16
            }
          };
          
          // Check if position fits in viewport
          const checkPosition = (pos: { top: number; left: number }) => {
            return pos.left >= padding && 
                   pos.left + tooltipWidth <= viewportWidth - padding &&
                   pos.top >= padding &&
                   pos.top + tooltipHeight <= viewportHeight - padding;
          };
          
          // Try preferred position first, then fallback to others
          let finalPosition = positions[preferredPosition as keyof typeof positions];
          
          if (!checkPosition(finalPosition)) {
            const fallbackOrder = ['bottom', 'top', 'right', 'left'];
            for (const position of fallbackOrder) {
              const testPos = positions[position as keyof typeof positions];
              if (checkPosition(testPos)) {
                finalPosition = testPos;
                break;
              }
            }
          }
          
          // Clamp to viewport bounds
          finalPosition.left = Math.max(padding, Math.min(finalPosition.left, viewportWidth - tooltipWidth - padding));
          finalPosition.top = Math.max(padding, Math.min(finalPosition.top, viewportHeight - tooltipHeight - padding));
          
          setTooltipPosition(finalPosition);

          // Scroll element into view
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        } else {
          setElementNotFound(true);
          setTargetPosition(null);
          setTooltipPosition({
            top: viewportHeight / 2 - 140,
            left: viewportWidth / 2 - 160
          });
        }
      } else {
        setElementNotFound(false);
        setTargetPosition(null);
        setTooltipPosition({
          top: viewportHeight / 2 - 140,
          left: viewportWidth / 2 - 160
        });
      }
    };

    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Poll for element existence (up to 1 second)
    let attempts = 0;
    const maxAttempts = 20; // 20 * 50ms = 1 second
    
    const pollForElement = () => {
      if (currentStep?.selector) {
        const element = document.querySelector(currentStep.selector);
        if (element || attempts >= maxAttempts) {
          updatePosition();
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else {
          attempts++;
        }
      } else {
        updatePosition();
      }
    };

    // Start polling
    pollForElement();
    pollingRef.current = setInterval(pollForElement, 50);

    // Handle scroll and resize
    const handleRecompute = () => {
      requestAnimationFrame(updatePosition);
    };
    
    window.addEventListener('scroll', handleRecompute);
    window.addEventListener('resize', handleRecompute);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      window.removeEventListener('scroll', handleRecompute);
      window.removeEventListener('resize', handleRecompute);
    };
  }, [currentStep, currentStepIndex]);

  const handleNext = () => {
    if (currentStep?.action) {
      // Execute action if specified
      if (currentStep.action.type === 'click' && currentStep.selector) {
        const element = document.querySelector(currentStep.selector) as HTMLElement;
        if (element) {
          element.click();
        }
      }
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Overlay with improved spotlight effect */}
      <div 
        ref={overlayRef} 
        className="absolute inset-0 bg-black/50 z-[10000]"
        style={{
          mask: targetPosition 
            ? `radial-gradient(ellipse ${targetPosition.width + 40}px ${targetPosition.height + 40}px at ${targetPosition.left + targetPosition.width/2}px ${targetPosition.top + targetPosition.height/2}px, transparent 50%, black 60%)`
            : 'none'
        }}
      />

      {/* Highlighted element border */}
      {targetPosition && (
        <div 
          className="absolute border-2 border-primary rounded-lg shadow-lg pointer-events-none z-[10001]" 
          style={{
            top: targetPosition.top - 2,
            left: targetPosition.left - 2,
            width: targetPosition.width + 4,
            height: targetPosition.height + 4
          }} 
        />
      )}

      {/* Tour tooltip */}
      <Card 
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          position: 'fixed'
        }} 
        className="w-80 shadow-2xl border-primary/20 py-[30px] bg-background z-[10002]"
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{guide.title}</h3>
              <span className="text-xs text-muted-foreground">
                {currentStepIndex + 1}/{guide.steps.length}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="h-auto p-1">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Step content */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{currentStep.title}</h4>
            <p className="text-sm text-muted-foreground">
              {currentStep.content}
              {elementNotFound && (
                <span className="block text-xs text-orange-500 mt-1">
                  Couldn't locate the target element, but you can still continue.
                </span>
              )}
            </p>
          </div>

          {/* Progress */}
          <Progress value={progress} className="h-1 mb-3" />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePrevious} 
              disabled={currentStepIndex === 0} 
              className="h-8"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip} className="h-8 text-xs">
                <SkipForward className="w-3 h-3 mr-1" />
                Skip Tour
              </Button>
              
              <Button onClick={handleNext} size="sm" className="h-8">
                {isLastStep ? 'Complete' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};