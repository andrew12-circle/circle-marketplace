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
    if (currentStep?.selector) {
      const element = document.querySelector(currentStep.selector);
      if (element) {
        requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          setTargetPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });

          // Calculate tooltip position
          const tooltipWidth = 300;
          const tooltipHeight = 200;
          let tooltipTop = rect.top + window.scrollY;
          let tooltipLeft = rect.left + window.scrollX;
          switch (currentStep.position) {
            case 'top':
              tooltipTop = rect.top + window.scrollY - tooltipHeight - 10;
              tooltipLeft = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
              break;
            case 'bottom':
              tooltipTop = rect.top + window.scrollY + rect.height + 10;
              tooltipLeft = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
              break;
            case 'left':
              tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
              tooltipLeft = rect.left + window.scrollX - tooltipWidth - 10;
              break;
            case 'right':
              tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
              tooltipLeft = rect.left + window.scrollX + rect.width + 10;
              break;
            default:
              tooltipTop = rect.top + window.scrollY + rect.height + 10;
              tooltipLeft = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
          }

          // Ensure tooltip stays within viewport with extra padding for buttons
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const padding = 20;
          if (tooltipLeft < padding) tooltipLeft = padding;
          if (tooltipLeft + tooltipWidth > viewportWidth - padding) {
            tooltipLeft = viewportWidth - tooltipWidth - padding;
          }
          if (tooltipTop < padding) tooltipTop = padding;
          if (tooltipTop + tooltipHeight > window.scrollY + viewportHeight - padding) {
            tooltipTop = window.scrollY + viewportHeight - tooltipHeight - padding;
          }
          setTooltipPosition({
            top: tooltipTop,
            left: tooltipLeft
          });

          // Scroll element into view
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        });
      }
    } else {
      setTargetPosition(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150
      });
    }
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
      left: tooltipPosition.left
    }} className="absolute w-80 shadow-2xl border-primary/20 py-[30px]">
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