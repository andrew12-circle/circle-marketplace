import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ConsultationBookingModal } from './ConsultationBookingModal';
import { LeadCaptureModal } from './LeadCaptureModal';
import { PreparationCourse } from './PreparationCourse';
import { supabase } from '@/integrations/supabase/client';

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

type FlowStep = 'booking' | 'lead_capture' | 'course' | 'complete';

export const ConsultationFlow = ({ isOpen, onClose, service }: ConsultationFlowProps) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('booking');
  const [consultationId, setConsultationId] = useState<string>('');
  const [serviceConfig, setServiceConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const fetchServiceConfig = async () => {
      if (!isOpen) return;
      
      setIsLoadingConfig(true);
      const { data, error } = await supabase
        .from('services')
        .select('booking_type, external_booking_provider, external_booking_url, booking_time_rules, sync_to_ghl')
        .eq('id', service.id)
        .single();

      if (!error && data) {
        setServiceConfig(data);
        // If external booking, go to lead capture first
        if (data.booking_type === 'external') {
          setCurrentStep('lead_capture');
        }
      }
      setIsLoadingConfig(false);
    };

    fetchServiceConfig();
  }, [isOpen, service.id]);

  const handleBookingConfirmed = (id: string) => {
    setConsultationId(id);
    setCurrentStep('course');
  };

  const handleLeadCaptured = () => {
    // Lead captured, external booking will handle the rest
    setCurrentStep('complete');
  };

  const handleReset = () => {
    setCurrentStep(serviceConfig?.booking_type === 'external' ? 'lead_capture' : 'booking');
    setConsultationId('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (isLoadingConfig) {
    return null; // Or a loading spinner
  }

  return (
    <>
      {currentStep === 'booking' && serviceConfig?.booking_type === 'internal' && (
        <ConsultationBookingModal
          isOpen={isOpen}
          onClose={handleClose}
          service={service}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {currentStep === 'lead_capture' && serviceConfig?.booking_type === 'external' && (
        <LeadCaptureModal
          isOpen={isOpen}
          onClose={handleClose}
          service={service}
          externalUrl={serviceConfig.external_booking_url}
          onLeadCaptured={handleLeadCaptured}
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

      {currentStep === 'complete' && serviceConfig?.booking_type === 'external' && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <div className="text-center space-y-4 p-6">
              <div className="text-2xl">✅</div>
              <h3 className="text-lg font-semibold">Thank You!</h3>
              <p className="text-muted-foreground">
                Your information has been captured. The booking calendar should have opened in a new tab.
              </p>
              <button 
                onClick={handleClose}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};