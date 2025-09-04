
// @ts-nocheck
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SecureForm } from '@/components/common/SecureForm';
import { commonRules } from '@/hooks/useSecureInput';
import { useProviderTracking } from '@/hooks/useProviderTracking';
import { useNavigate } from 'react-router-dom';

interface ConsultationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    vendor: {
      name: string;
    } | null;
  };
  onBookingConfirmed: (consultationId: string) => void;
}

export const ConsultationBookingModal = ({ 
  isOpen, 
  onClose, 
  service, 
  onBookingConfirmed 
}: ConsultationBookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [integrationErrors, setIntegrationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { trackBooking } = useProviderTracking(service.id, isOpen);
  const navigate = useNavigate();

  // Pre-populate form with user data when signed in
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Business hours: Monday-Friday 10am-4pm CST (converted to local display)
  const businessTimeSlots = [
    '10:00 AM CST', '10:30 AM CST', '11:00 AM CST', '11:30 AM CST', 
    '12:00 PM CST', '12:30 PM CST', '1:00 PM CST', '1:30 PM CST', 
    '2:00 PM CST', '2:30 PM CST', '3:00 PM CST', '3:30 PM CST'
  ];

  // Check if date is a weekday (Monday-Friday) and at least 24 hours out
  const isDateAvailable = (date: Date) => {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    
    // 0 = Sunday, 6 = Saturday, so we want 1-5 (Monday-Friday)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const is24HoursOut = date >= twentyFourHoursFromNow;
    
    return isWeekday && is24HoursOut;
  };

  const handleSecureSubmit = async (data: Record<string, string>) => {
    // Gate behind authentication
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to book a consultation. You'll be redirected back to this form after signing in.",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              navigate('/auth');
              onClose();
            }}
          >
            Sign In
          </Button>
        )
      });
      throw new Error("Authentication required");
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time",
        variant: "destructive"
      });
      throw new Error("Date and time are required");
    }

    // Validate business hours
    if (!isDateAvailable(selectedDate)) {
      toast({
        title: "Invalid Date",
        description: "Please select a weekday that is at least 24 hours from now",
        variant: "destructive"
      });
      throw new Error("Invalid date selected");
    }

    setIsSubmitting(true);
    setIntegrationErrors([]);
    console.log('[Consultation Booking] Starting booking process for service:', service.id);
    
    try {
      // Create internal booking record
      console.log('[Consultation Booking] Inserting booking record...');
      const { data: bookingData, error } = await supabase
        .from('consultation_bookings')
        .insert({
          user_id: user.id,
          service_id: service.id,
          scheduled_date: selectedDate.toISOString().split('T')[0],
          scheduled_time: selectedTime,
          client_name: data.client_name,
          client_email: data.client_email,
          client_phone: data.client_phone || null,
          project_details: data.project_details || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[Consultation Booking] Database insert failed:', error);
        // Handle RLS errors specifically
        if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          toast({
            title: "Authentication Error",
            description: "Please sign in and try again. If the problem persists, refresh the page.",
            variant: "destructive"
          });
          throw new Error("RLS authentication error");
        }
        throw error;
      }

      console.log('[Consultation Booking] Successfully created booking:', bookingData.id);

      // Create Go High Level contact and send to GHL
      console.log('[Consultation Booking] Calling GHL integration...');
      try {
        const ghlResponse = await supabase.functions.invoke('create-ghl-contact', {
          body: {
            bookingId: bookingData.id,
            firstName: data.client_name.split(' ')[0] || data.client_name,
            lastName: data.client_name.split(' ').slice(1).join(' ') || '',
            email: data.client_email,
            phone: data.client_phone || '',
            serviceTitle: service.title,
            vendorName: service.vendor?.name || 'Direct Service',
            scheduledDate: selectedDate.toISOString().split('T')[0],
            scheduledTime: selectedTime,
            projectDetails: data.project_details || '',
            source: 'Circle Marketplace Consultation'
          }
        });

        if (ghlResponse.error) {
          console.error('[Consultation Booking] GHL integration failed:', ghlResponse.error);
          setIntegrationErrors(prev => [...prev, 'CRM integration']);
        } else {
          console.log('[Consultation Booking] GHL integration successful:', ghlResponse.data);
        }
      } catch (ghlError) {
        console.error('[Consultation Booking] GHL integration error:', ghlError);
        setIntegrationErrors(prev => [...prev, 'CRM integration']);
      }

      // Send internal notification
      console.log('[Consultation Booking] Sending notification...');
        try {
          await supabase.functions.invoke('send-consultation-notification', {
            body: {
              bookingId: bookingData.id,
              serviceId: service.id,
              serviceTitle: service.title,
              vendorName: service.vendor?.name || 'Direct Service',
              clientName: data.client_name,
              clientEmail: data.client_email,
              clientPhone: data.client_phone,
              scheduledDate: selectedDate.toISOString().split('T')[0],
              scheduledTime: selectedTime,
              projectDetails: data.project_details,
              isInternalBooking: true
            }
          });
          console.log('[Consultation Booking] Notification sent successfully');
        } catch (notificationError) {
          console.error('[Consultation Booking] Notification failed:', notificationError);
          setIntegrationErrors(prev => [...prev, 'email notification']);
        }

      // Track successful booking
      try {
        await trackBooking({
          id: bookingData.id,
          type: 'consultation',
          value: 0 // Consultations are free
        });
        console.log('[Consultation Booking] Tracking recorded');
      } catch (trackingError) {
        console.error('[Consultation Booking] Tracking failed:', trackingError);
      }

      const successMessage = integrationErrors.length > 0 
        ? `Consultation booked successfully! Note: Some integrations failed (${integrationErrors.join(', ')}). We'll still notify ${service.vendor?.name || 'the vendor'} and confirm your appointment.`
        : `Perfect! Your consultation with ${service.vendor?.name || 'the vendor'} has been requested. They'll be notified immediately and will contact you soon to confirm the details.`;

      toast({
        title: "Consultation Booked Successfully!",
        description: successMessage,
        ...(integrationErrors.length > 0 && {
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = 'mailto:support@circlemarketplace.io?subject=Consultation Booking Support'}
            >
              Need Help?
            </Button>
          )
        })
      });

      console.log('[Consultation Booking] Process completed successfully');
      onBookingConfirmed(bookingData.id);
      onClose();
    } catch (error) {
      console.error('[Consultation Booking] Process failed:', error);
      
      // Provide specific error messages
      let errorMessage = "There was an error booking your consultation. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          return; // Don't show additional error, auth message already shown
        }
        if (error.message.includes('RLS')) {
          errorMessage = "Authentication error. Please refresh the page and try again.";
        }
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
        action: integrationErrors.length === 0 ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = 'mailto:support@circlemarketplace.io?subject=Booking Error Support'}
          >
            Get Help
          </Button>
        ) : undefined
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const validationRules = {
    client_name: commonRules.name,
    client_email: commonRules.email,
    client_phone: commonRules.phone,
    project_details: commonRules.description,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Book Consultation: {service.title}
          </DialogTitle>
        </DialogHeader>

        {/* Authentication Check */}
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-800">Sign In Required</p>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              You need to be signed in to book a consultation. 
              <Button 
                variant="link" 
                className="p-0 ml-1 text-yellow-800 underline" 
                onClick={() => navigate('/auth')}
              >
                Sign in now
              </Button>
            </p>
          </div>
        )}

        <SecureForm 
          validationRules={validationRules}
          onSubmit={handleSecureSubmit}
          className="space-y-6"
          requireCSRF={false}
        >
          {/* Service Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-muted-foreground">CONSULTATION WITH CIRCLE TEAM</h3>
            <p className="font-medium">Circle Marketplace Team</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll help connect you with {service.vendor?.name || 'the right vendor'} and ensure you get the best solution for your needs.
            </p>
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Business Hours:</strong> Monday-Friday, 10:00 AM - 4:00 PM CST<br/>
              <strong>Advance Notice:</strong> Minimum 24 hours required
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Select Date *</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only weekdays (Mon-Fri) at least 24 hours in advance
              </p>
            </div>
            <div>
              <Label htmlFor="time">Select Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {businessTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                All times shown in Central Standard Time (CST)
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Full Name *</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_email">Email *</Label>
                <Input
                  id="client_email"
                  name="client_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="client_phone">Phone Number</Label>
              <Input
                id="client_phone"
                name="client_phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Project Information
            </h3>
            <div>
              <Label htmlFor="project_details">Project Details</Label>
              <Textarea
                id="project_details"
                name="project_details"
                placeholder="Tell us about your project, goals, and any specific requirements..."
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Booking...' : 'Book Consultation'}
            </Button>
          </div>
        </SecureForm>
      </DialogContent>
    </Dialog>
  );
};
