import { useState } from 'react';
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

interface ConsultationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    vendor: {
      name: string;
    };
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
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
  ];

  const handleSecureSubmit = async (data: Record<string, string>) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time",
        variant: "destructive"
      });
      throw new Error("Date and time are required");
    }

    setIsSubmitting(true);
    try {
      const { data: bookingData, error } = await supabase
        .from('consultation_bookings')
        .insert({
          user_id: user?.id,
          service_id: service.id,
          scheduled_date: selectedDate.toISOString().split('T')[0],
          scheduled_time: selectedTime,
          client_name: data.client_name,
          client_email: data.client_email,
          client_phone: data.client_phone || null,
          project_details: data.project_details || null,
          budget_range: data.budget_range || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to vendor
      try {
        const notificationResponse = await supabase.functions.invoke('send-consultation-notification', {
          body: {
            bookingId: bookingData.id,
            serviceTitle: service.title,
            vendorName: service.vendor.name,
            clientName: data.client_name,
            clientEmail: data.client_email,
            clientPhone: data.client_phone,
            scheduledDate: selectedDate.toISOString().split('T')[0],
            scheduledTime: selectedTime,
            projectDetails: data.project_details,
            budgetRange: data.budget_range
          }
        });

        if (notificationResponse.error) {
          console.error('Failed to send vendor notification:', notificationResponse.error);
          // Don't fail the booking if notification fails
        }
      } catch (notificationError) {
        console.error('Error sending vendor notification:', notificationError);
        // Don't fail the booking if notification fails
      }

      toast({
        title: "Consultation Booked!",
        description: "We'll send you a confirmation email shortly. The service provider has been notified and will contact you soon.",
      });

      onBookingConfirmed(bookingData.id);
      onClose();
    } catch (error) {
      console.error('Error booking consultation:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your consultation. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to let SecureForm handle it
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

        <SecureForm 
          validationRules={validationRules}
          onSubmit={handleSecureSubmit}
          className="space-y-6"
        >
          {/* Service Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-muted-foreground">SERVICE PROVIDER</h3>
            <p className="font-medium">{service.vendor.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              This consultation will help determine your exact project needs and provide accurate pricing.
            </p>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Select Date *</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-md border mt-2"
              />
            </div>
            <div>
              <Label htmlFor="time">Select Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div>
              <Label htmlFor="budget_range">Budget Range</Label>
              <input
                type="hidden"
                name="budget_range"
                value={budget}
              />
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-5k">Under $5,000</SelectItem>
                  <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                  <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                  <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                  <SelectItem value="over-100k">Over $100,000</SelectItem>
                  <SelectItem value="flexible">I'm flexible</SelectItem>
                </SelectContent>
              </Select>
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