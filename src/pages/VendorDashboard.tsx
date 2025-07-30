import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Settings, 
  Bell, 
  Users, 
  Star,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X
} from 'lucide-react';

interface VendorData {
  id: string;
  name: string;
  contact_email: string;
  individual_email?: string;
}

interface AvailabilityData {
  is_available_now: boolean;
  availability_message?: string;
  next_available_slot?: string;
  calendar_link?: string;
}

interface ConsultationBooking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  project_details?: string;
  budget_range?: string;
  status: string;
  created_at: string;
  services: {
    title: string;
  };
}

export const VendorDashboard = () => {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData>({
    is_available_now: false,
    availability_message: '',
    next_available_slot: '',
    calendar_link: ''
  });
  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would authenticate the vendor first
      // For demo purposes, we'll load the first vendor
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .limit(1)
        .single();

      if (vendorError) throw vendorError;
      setVendorData(vendor);

      // Load availability data
      const { data: availabilityData } = await supabase
        .from('vendor_availability')
        .select('*')
        .eq('vendor_id', vendor.id)
        .single();

      if (availabilityData) {
        setAvailability({
          is_available_now: availabilityData.is_available_now,
          availability_message: availabilityData.availability_message || '',
          next_available_slot: availabilityData.next_available_slot || '',
          calendar_link: availabilityData.calendar_link || ''
        });
      }

      // Load consultations
      const { data: consultationData } = await supabase
        .from('consultation_bookings')
        .select(`
          *,
          services:service_id (title)
        `)
        .eq('service_id', vendor.id)
        .order('created_at', { ascending: false });

      if (consultationData) {
        setConsultations(consultationData);
      }

    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAvailability = async () => {
    if (!vendorData) return;

    try {
      const { error } = await supabase
        .from('vendor_availability')
        .upsert({
          vendor_id: vendorData.id,
          is_available_now: availability.is_available_now,
          availability_message: availability.availability_message,
          next_available_slot: availability.next_available_slot || null,
          calendar_link: availability.calendar_link
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability settings updated"
      });
      setIsEditingAvailability(false);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability settings",
        variant: "destructive"
      });
    }
  };

  const updateConsultationStatus = async (consultationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update({ status: newStatus })
        .eq('id', consultationId);

      if (error) throw error;

      setConsultations(prev => 
        prev.map(c => 
          c.id === consultationId ? { ...c, status: newStatus } : c
        )
      );

      toast({
        title: "Success",
        description: `Consultation marked as ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast({
        title: "Error",
        description: "Failed to update consultation status",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading vendor dashboard...</div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vendor Access Required</h1>
          <p>Please contact Circle Network to set up your vendor dashboard access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {vendorData.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${availability.is_available_now ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-medium">
            {availability.is_available_now ? 'Available Now' : 'Available Soon'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultations.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => c.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Needs response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => 
                new Date(c.created_at).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">New consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="consultations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Consultation Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No consultation requests yet
                  </div>
                ) : (
                  consultations.map((consultation) => (
                    <div key={consultation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{consultation.client_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {consultation.services?.title}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>📅 {consultation.scheduled_date}</span>
                            <span>🕐 {consultation.scheduled_time}</span>
                            <span>📧 {consultation.client_email}</span>
                            {consultation.client_phone && (
                              <span>📱 {consultation.client_phone}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            consultation.status === 'pending' ? 'destructive' :
                            consultation.status === 'confirmed' ? 'default' : 'secondary'
                          }>
                            {consultation.status}
                          </Badge>
                        </div>
                      </div>

                      {consultation.project_details && (
                        <div>
                          <Label className="text-sm font-medium">Project Details:</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {consultation.project_details}
                          </p>
                        </div>
                      )}

                      {consultation.budget_range && (
                        <div>
                          <Label className="text-sm font-medium">Budget Range:</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {consultation.budget_range}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {consultation.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateConsultationStatus(consultation.id, 'confirmed')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateConsultationStatus(consultation.id, 'cancelled')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Contact Client
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Availability Settings</CardTitle>
              <Button 
                size="sm" 
                variant={isEditingAvailability ? "outline" : "default"}
                onClick={() => setIsEditingAvailability(!isEditingAvailability)}
              >
                {isEditingAvailability ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditingAvailability ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Available Now</Label>
                  <p className="text-sm text-muted-foreground">
                    Show clients you're available for immediate consultation
                  </p>
                </div>
                <Switch 
                  checked={availability.is_available_now}
                  onCheckedChange={(checked) => 
                    setAvailability(prev => ({ ...prev, is_available_now: checked }))
                  }
                  disabled={!isEditingAvailability}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="availability-message">Availability Message</Label>
                <Textarea
                  id="availability-message"
                  placeholder="e.g., Typically responds within 1 hour"
                  value={availability.availability_message}
                  onChange={(e) => 
                    setAvailability(prev => ({ ...prev, availability_message: e.target.value }))
                  }
                  disabled={!isEditingAvailability}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next-available">Next Available Slot</Label>
                <Input
                  id="next-available"
                  type="datetime-local"
                  value={availability.next_available_slot}
                  onChange={(e) => 
                    setAvailability(prev => ({ ...prev, next_available_slot: e.target.value }))
                  }
                  disabled={!isEditingAvailability}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calendar-link">Calendar Link</Label>
                <Input
                  id="calendar-link"
                  placeholder="https://calendly.com/your-link"
                  value={availability.calendar_link}
                  onChange={(e) => 
                    setAvailability(prev => ({ ...prev, calendar_link: e.target.value }))
                  }
                  disabled={!isEditingAvailability}
                />
              </div>

              {isEditingAvailability && (
                <div className="flex gap-2">
                  <Button onClick={saveAvailability}>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingAvailability(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Customization</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize how your services appear to potential clients
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Service customization features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts for new consultation requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get text messages for urgent consultation requests
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  value={vendorData.individual_email || vendorData.contact_email}
                  readOnly
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};