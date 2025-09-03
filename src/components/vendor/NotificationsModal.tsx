import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bell, 
  Star, 
  DollarSign, 
  Users, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Mail,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'review' | 'booking' | 'payment' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
}

export const NotificationsModal = ({ isOpen, onClose, vendorId }: NotificationsModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'reviews' | 'bookings'>('all');
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, vendorId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor email notification settings
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('email_notifications_enabled')
        .eq('id', vendorId)
        .single();

      if (vendorData) {
        setEmailNotificationsEnabled(vendorData.email_notifications_enabled || false);
      }
      
      // Generate notifications based on recent activity
      const notifications: Notification[] = [];

      // Fetch recent reviews
      const { data: reviewsData } = await supabase
        .from('service_reviews')
        .select(`
          id,
          rating,
          review,
          created_at,
          services (
            title,
            vendor_id
          ),
          profiles (
            display_name
          )
        `)
        .eq('services.vendor_id', vendorId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(10);

      // Convert reviews to notifications
      (reviewsData || []).forEach((review: any) => {
        const reviewerName = review.profiles?.display_name || 'A customer';
        const serviceTitle = review.services?.title || 'Unknown Service';
          
        notifications.push({
          id: `review-${review.id}`,
          type: 'review',
          title: 'New Review Received',
          message: `${reviewerName} left a ${review.rating}-star review for "${serviceTitle}"`,
          read: false,
          created_at: review.created_at,
          metadata: { rating: review.rating, service: serviceTitle, reviewText: review.review }
        });
      });

      // Fetch recent bookings
      const { data: bookingsData } = await supabase
        .from('consultation_bookings')
        .select(`
          id,
          booking_date,
          created_at,
          status,
          services (
            title,
            vendor_id
          ),
          profiles (
            display_name
          )
        `)
        .eq('services.vendor_id', vendorId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(10);

      // Convert bookings to notifications
      (bookingsData || []).forEach((booking: any) => {
        const bookerName = booking.profiles?.display_name || 'A customer';
        const serviceTitle = booking.services?.title || 'Unknown Service';
          
        notifications.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: 'New Consultation Booked',
          message: `${bookerName} booked a consultation for "${serviceTitle}"`,
          read: false,
          created_at: booking.created_at,
          metadata: { 
            service: serviceTitle,
            bookingDate: booking.booking_date,
            status: booking.status
          }
        });
      });

      // Add some system notifications
      notifications.push({
        id: 'system-1',
        type: 'system',
        title: 'Dashboard Analytics Update',
        message: 'Your monthly performance report is now available in the Analytics section.',
        read: false,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {}
      });

      // Sort by date and limit
      const sortedNotifications = notifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast({
      title: "Success",
      description: "All notifications marked as read",
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
    toast({
      title: "Success",
      description: "Notification deleted",
    });
  };

  const toggleEmailNotifications = async () => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ email_notifications_enabled: !emailNotificationsEnabled })
        .eq('id', vendorId);

      if (error) throw error;
      
      setEmailNotificationsEnabled(!emailNotificationsEnabled);
      toast({
        title: "Success",
        description: `Email notifications ${!emailNotificationsEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating email notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'booking':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.read;
      case 'reviews':
        return notif.type === 'review';
      case 'bookings':
        return notif.type === 'booking';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="ml-auto"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <p className="text-muted-foreground">
            Stay updated with your latest activity and important updates
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Settings */}
          {showSettings && (
            <Card className="p-4 bg-muted/50 border-2 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-lg">Email Notifications</span>
                </div>
                <Button
                  variant={emailNotificationsEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleEmailNotifications}
                >
                  {emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for new reviews, bookings, and important updates directly to your inbox.
              </p>
            </Card>
          )}

          {/* Filter Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'reviews' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('reviews')}
              >
                Reviews
              </Button>
              <Button
                variant={filter === 'bookings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('bookings')}
              >
                Bookings
              </Button>
            </div>
            
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No notifications found</p>
                <p className="text-sm">New notifications will appear here</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all cursor-pointer ${
                    !notification.read 
                      ? 'border-blue-200 bg-blue-50/50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`font-medium ${!notification.read ? 'text-blue-900' : ''}`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${!notification.read ? 'text-blue-800' : 'text-muted-foreground'}`}>
                              {notification.message}
                            </p>
                            
                            {/* Additional metadata */}
                            {notification.type === 'review' && notification.metadata?.rating && (
                              <div className="flex items-center gap-1 mt-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < notification.metadata.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};