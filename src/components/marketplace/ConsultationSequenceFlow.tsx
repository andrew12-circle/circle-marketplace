import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ConsultationBookingModal } from './ConsultationBookingModal';
import { PreparationCourse } from './PreparationCourse';
import { CheckCircle } from 'lucide-react';

interface ConsultationItem {
  serviceId: string;
  title: string;
  vendor: string;
  image_url?: string;
  price: number;
}

interface ConsultationSequenceFlowProps {
  isOpen: boolean;
  onClose: () => void;
  consultationItems: ConsultationItem[];
  onComplete: () => void;
}

type FlowStep = 'booking' | 'courses' | 'complete';

export const ConsultationSequenceFlow = ({ 
  isOpen, 
  onClose, 
  consultationItems, 
  onComplete 
}: ConsultationSequenceFlowProps) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('booking');
  const [currentBookingIndex, setCurrentBookingIndex] = useState(0);
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const [bookedConsultations, setBookedConsultations] = useState<string[]>([]);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);

  const handleBookingConfirmed = (consultationId: string) => {
    const serviceId = consultationItems[currentBookingIndex].serviceId;
    setBookedConsultations(prev => [...prev, serviceId]);
    
    // Move to next booking or start courses
    if (currentBookingIndex < consultationItems.length - 1) {
      setCurrentBookingIndex(currentBookingIndex + 1);
    } else {
      setCurrentStep('courses');
      setCurrentCourseIndex(0);
    }
  };

  const handleCourseComplete = () => {
    const serviceId = consultationItems[currentCourseIndex].serviceId;
    setCompletedCourses(prev => [...prev, serviceId]);
    
    // Move to next course or complete
    if (currentCourseIndex < consultationItems.length - 1) {
      setCurrentCourseIndex(currentCourseIndex + 1);
    } else {
      setCurrentStep('complete');
    }
  };

  const handleClose = () => {
    setCurrentStep('booking');
    setCurrentBookingIndex(0);
    setCurrentCourseIndex(0);
    setBookedConsultations([]);
    setCompletedCourses([]);
    onClose();
  };

  const handleFinish = () => {
    onComplete();
    handleClose();
  };

  const currentBookingItem = consultationItems[currentBookingIndex];
  const currentCourseItem = consultationItems[currentCourseIndex];
  
  const bookingProgress = (currentBookingIndex / consultationItems.length) * 50;
  const courseProgress = 50 + (currentCourseIndex / consultationItems.length) * 50;

  if (currentStep === 'booking' && currentBookingItem) {
    return (
      <ConsultationBookingModal
        isOpen={isOpen}
        onClose={handleClose}
        service={{
          id: currentBookingItem.serviceId,
          title: currentBookingItem.title,
          vendor: { name: currentBookingItem.vendor }
        }}
        onBookingConfirmed={handleBookingConfirmed}
      />
    );
  }

  if (currentStep === 'courses' && currentCourseItem) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <PreparationCourse
            consultationId={`${currentCourseItem.serviceId}-consultation`}
            serviceTitle={currentCourseItem.title}
            onClose={handleCourseComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (currentStep === 'complete') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              All Set!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <p className="text-lg mb-4">
              You've successfully booked all consultations and completed the preparation courses.
            </p>
            
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>✓ {consultationItems.length} consultations booked</p>
              <p>✓ {consultationItems.length} preparation courses completed</p>
            </div>
            
            <p className="text-sm">
              You'll receive confirmation emails for each consultation. 
              The service providers will contact you to schedule your appointments.
            </p>
          </div>
          
          <Button onClick={handleFinish} className="w-full">
            Finish
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Progress overview (should not normally be reached)
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Consultation Setup Progress</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(currentStep === 'booking' ? bookingProgress : courseProgress)}%</span>
            </div>
            <Progress value={currentStep === 'booking' ? bookingProgress : courseProgress} />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                bookedConsultations.length === consultationItems.length 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {bookedConsultations.length}
              </div>
              <span className="text-sm">
                Consultations Booked ({bookedConsultations.length}/{consultationItems.length})
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                completedCourses.length === consultationItems.length 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {completedCourses.length}
              </div>
              <span className="text-sm">
                Preparation Courses ({completedCourses.length}/{consultationItems.length})
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};