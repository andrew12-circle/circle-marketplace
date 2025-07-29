import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ConsultationBookingModal } from './ConsultationBookingModal';
import { PreparationCourse } from './PreparationCourse';

interface ConsultationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    vendor: {
      name: string;
    };
  };
}

type FlowStep = 'booking' | 'course' | 'complete';

export const ConsultationFlow = ({ isOpen, onClose, service }: ConsultationFlowProps) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('booking');
  const [consultationId, setConsultationId] = useState<string>('');

  const handleBookingConfirmed = (id: string) => {
    setConsultationId(id);
    setCurrentStep('course');
  };

  const handleReset = () => {
    setCurrentStep('booking');
    setConsultationId('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <>
      {currentStep === 'booking' && (
        <ConsultationBookingModal
          isOpen={isOpen}
          onClose={handleClose}
          service={service}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}
      
      {currentStep === 'course' && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            <PreparationCourse
              consultationId={consultationId}
              serviceTitle={service.title}
              onClose={handleClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};