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
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentStep = guide.steps[currentStepIndex];
  const isLastStep = currentStepIndex === guide.steps.length - 1;
  const progress = (currentStepIndex + 1) / guide.steps.length * 100;
  useEffect(() => {
    const updatePosition = () => {
      if (currentStep?.selector) {
        const element = document.querySelector(currentStep.selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });

          // Calculate tooltip position with improved viewport detection
          const tooltipWidth = 320; // w-80 = 320px
          const tooltipHeight = 280; // Increased estimated height
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const padding = 20;
          
          let preferredPosition = currentStep.position || 'bottom';
          
          // Calculate positions for each direction
          const positions = {
            top: {
              top: rect.top + window.scrollY - tooltipHeight - 16,
              left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2
            },
            bottom: {
              top: rect.top + window.scrollY + rect.height + 16,
              left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2
            },
            left: {
              top: rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2,
              left: rect.left + window.scrollX - tooltipWidth - 16
            },
            right: {
              top: rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2,
              left: rect.left + window.scrollX + rect.width + 16
            }
          };
          
          // Check if preferred position fits in viewport
          const checkPosition = (pos: { top: number; left: number }) => {
            return pos.left >= padding && 
                   pos.left + tooltipWidth <= viewportWidth - padding &&
                   pos.top >= window.scrollY + padding &&
                   pos.top + tooltipHeight <= window.scrollY + viewportHeight - padding;
          };
          
          // Try preferred position first, then fallback to others
          let finalPosition = positions[preferredPosition as keyof typeof positions];
          
          if (!checkPosition(finalPosition)) {
            // Try other positions in order of preference
            const fallbackOrder = ['bottom', 'top', 'right', 'left'];
            for (const position of fallbackOrder) {
              const testPos = positions[position as keyof typeof positions];
              if (checkPosition(testPos)) {
                finalPosition = testPos;
                break;
              }
            }
          }
          
          // Force position within viewport bounds as last resort
          finalPosition.left = Math.max(padding, Math.min(finalPosition.left, viewportWidth - tooltipWidth - padding));
          finalPosition.top = Math.max(window.scrollY + padding, Math.min(finalPosition.top, window.scrollY + viewportHeight - tooltipHeight - padding));
          
          setTooltipPosition({
            top: finalPosition.top,
            left: finalPosition.left
          });

          // Scroll element into view with better positioning
          setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }, 100);
        } else {
          // Element not found - fallback to center position
          console.warn(`Tour element not found: ${currentStep.selector}`);
          setTargetPosition(null);
          setTooltipPosition({
            top: window.scrollY + window.innerHeight / 2 - 140,
            left: window.innerWidth / 2 - 160
          });
        }
      } else {
        setTargetPosition(null);
        // Center tooltip when no target element
        setTooltipPosition({
          top: window.scrollY + window.innerHeight / 2 - 140,
          left: window.innerWidth / 2 - 160
        });
      }
    };

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(updatePosition, 50);
    
    return () => clearTimeout(timeoutId);
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
  return <div className="fixed inset-0 z-[9999]">
      {/* Overlay with spotlight effect */}
      <div ref={overlayRef} className="absolute inset-0 bg-black/50" style={{
      clipPath: targetPosition ? `polygon(0% 0%, 0% 100%, ${targetPosition.left}px 100%, ${targetPosition.left}px ${targetPosition.top}px, ${targetPosition.left + targetPosition.width}px ${targetPosition.top}px, ${targetPosition.left + targetPosition.width}px ${targetPosition.top + targetPosition.height}px, ${targetPosition.left}px ${targetPosition.top + targetPosition.height}px, ${targetPosition.left}px 100%, 100% 100%, 100% 0%)` : 'none'
    }} />

      {/* Highlighted element border */}
      {targetPosition && <div className="absolute border-2 border-primary rounded-lg shadow-lg pointer-events-none" style={{
      top: targetPosition.top - 2,
      left: targetPosition.left - 2,
      width: targetPosition.width + 4,
      height: targetPosition.height + 4
    }} />}

      {/* Tour tooltip */}
      <Card style={{
      top: tooltipPosition.top,
      left: tooltipPosition.left,
      position: 'fixed'
    }} className="w-80 shadow-2xl border-primary/20 py-[30px] bg-background z-[10001]">
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
            <p className="text-sm text-muted-foreground">{currentStep.content}</p>
          </div>

          {/* Progress */}
          <Progress value={progress} className="h-1 mb-3" />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" size="sm" onClick={handlePrevious} disabled={currentStepIndex === 0} className="h-8">
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
    </div>;
};