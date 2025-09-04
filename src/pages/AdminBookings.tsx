import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Mail, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { BookingSummaryStats } from '@/components/admin/BookingSummaryStats';

interface ConsultationBooking {
  id: string;
  service_id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  scheduled_date: string;
  scheduled_time: string;
  project_details?: string;
  status: string;
  created_at: string;
  services?: {
    title: string;
    vendor?: {
      name: string;
      contact_email: string;
    };
  };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    vendor_confirmed: 0,
    vendor_declined: 0,
    cancelled: 0,
    completed: 0,
    today: 0,
    this_week: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_bookings')
        .select(`
          *,
          services (
            title,
            vendors (
              name,
              contact_email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      
      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newStats = {
        total: data?.length || 0,
        pending: data?.filter(b => b.status === 'pending').length || 0,
        confirmed: data?.filter(b => b.status === 'confirmed').length || 0,
        vendor_confirmed: data?.filter(b => b.status === 'vendor_confirmed').length || 0,
        vendor_declined: data?.filter(b => b.status === 'vendor_declined').length || 0,
        cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
        completed: data?.filter(b => b.status === 'completed').length || 0,
        today: data?.filter(b => new Date(b.created_at) >= today).length || 0,
        this_week: data?.filter(b => new Date(b.created_at) >= weekAgo).length || 0
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        )
      );

      toast({
        title: "Status Updated",
        description: `Booking marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.services?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.services?.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'vendor_confirmed': return 'bg-emerald-500';
      case 'vendor_declined': return 'bg-orange-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Consultation Bookings Management</h1>
        <div className="text-sm text-muted-foreground">
          {filteredBookings.length} of {bookings.length} bookings
        </div>
      </div>

      <BookingSummaryStats stats={stats} />

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by client name, email, service, or vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Admin Confirmed</option>
          <option value="vendor_confirmed">Vendor Confirmed</option>
          <option value="vendor_declined">Vendor Declined</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {/* Bookings List */}
      <div className="grid gap-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Booked {format(new Date(booking.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                  disabled={['confirmed', 'vendor_confirmed', 'completed'].includes(booking.status)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Admin Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                  disabled={booking.status === 'completed'}
                >
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                  disabled={['cancelled', 'completed'].includes(booking.status)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`mailto:${booking.client_email}?subject=Re: Your consultation booking&body=Hi ${booking.client_name},%0A%0ARegarding your consultation for ${booking.services?.title}...`)}
                >
                  Email Client
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Client Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {booking.client_name}</div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <a href={`mailto:${booking.client_email}`} className="text-primary hover:underline">
                      {booking.client_email}
                    </a>
                  </div>
                  {booking.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${booking.client_phone}`} className="text-primary hover:underline">
                        {booking.client_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Service & Schedule Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Service & Schedule
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Service:</strong> {booking.services?.title}</div>
                  <div><strong>Vendor:</strong> {booking.services?.vendor?.name}</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(booking.scheduled_date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {booking.scheduled_time}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            {booking.project_details && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Project Details
                </h4>
                <p className="text-sm text-muted-foreground">{booking.project_details}</p>
              </div>
            )}

            {/* Vendor Contact */}
            {booking.services?.vendor?.contact_email && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Vendor Contact:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`mailto:${booking.services?.vendor?.contact_email}?subject=Consultation Booking - ${booking.services?.title}&body=Hi,\n\nWe have a consultation booking for ${booking.client_name} on ${format(new Date(booking.scheduled_date), 'MMMM d, yyyy')} at ${booking.scheduled_time}.\n\nClient Contact:\n- Email: ${booking.client_email}\n- Phone: ${booking.client_phone || 'Not provided'}\n\nProject Details:\n${booking.project_details || 'No details provided'}\n\nPlease confirm your availability or suggest alternative times.\n\nThanks!`)}
                  >
                    Email Vendor
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No consultation bookings have been made yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
}