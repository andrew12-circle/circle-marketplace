// @ts-nocheck
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ConsultationBookingModal } from './ConsultationBookingModal';
import { LeadCaptureModal } from './LeadCaptureModal';
import { PreparationCourse } from './PreparationCourse';
import { VendorSelectionModal } from './VendorSelectionModal';
import { VendorReferralModal } from './VendorReferralModal';
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
    image_url?: string;
  };
}

type FlowStep = 'booking' | 'lead_capture' | 'course' | 'complete' | 'meeting_confirmed';

export const ConsultationFlow = ({ isOpen, onClose, service }: ConsultationFlowProps) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('booking');
  const [consultationId, setConsultationId] = useState<string>('');
  const [serviceConfig, setServiceConfig] = useState<any>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [showVendorSelection, setShowVendorSelection] = useState(false);
  const [showVendorReferral, setShowVendorReferral] = useState(false);

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
    setCurrentStep('meeting_confirmed');
  };

  const handleLeadCaptured = () => {
    setCurrentStep('meeting_confirmed');
  };

  const handleReset = () => {
    setCurrentStep(serviceConfig?.booking_type === 'external' ? 'lead_capture' : 'booking');
    setConsultationId('');
    setShowVendorSelection(false);
    setShowVendorReferral(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleContinueFromMeetingConfirmed = () => {
    if (serviceConfig?.booking_type === 'external') {
      setCurrentStep('complete');
    } else {
      setCurrentStep('course');
    }
  };

  const handleVendorModalClose = () => {
    setShowVendorSelection(false);
    setShowVendorReferral(false);
    handleContinueFromMeetingConfirmed();
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

      {currentStep === 'meeting_confirmed' && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <div className="text-center space-y-6 p-6">
              <div className="text-3xl">✅</div>
              <h3 className="text-xl font-semibold">Meeting Confirmed!</h3>
              <div className="space-y-4 text-left">
                <p className="text-muted-foreground">
                  Want vendor help to make your bill less if you decide to purchase? Here are vetted vendors looking for partnerships.
                </p>
                <p className="text-muted-foreground font-medium">
                  OR you can add your current vendors and our concierge team will reach out and do the asking for you.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  Our goal is to make sure vendors still get a shot to help you at every step.
                </p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowVendorSelection(true)}
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                >
                  See Vetted Vendors
                </button>
                <button 
                  onClick={() => setShowVendorReferral(true)}
                  className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90"
                >
                  Add My Current Vendor
                </button>
                <button 
                  onClick={handleContinueFromMeetingConfirmed}
                  className="w-full bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80"
                >
                  Continue
                </button>
              </div>
            </div>
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

      {showVendorSelection && (
        <VendorSelectionModal
          isOpen={showVendorSelection}
          onClose={handleVendorModalClose}
          onVendorSelect={handleVendorModalClose}
          service={{
            id: service.id,
            title: service.title,
            image_url: service.image_url || ''
          }}
        />
      )}

      <VendorReferralModal
        isOpen={showVendorReferral}
        onClose={handleVendorModalClose}
        serviceTitle={service.title}
      />
    </>
  );
};