import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, DollarSign, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface PaymentSchedule {
  id: string;
  co_pay_request_id: string;
  agent_id: string;
  vendor_id: string;
  payment_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
  auto_renewal: boolean;
  total_amount_covered: number;
  agent_profile?: {
    display_name?: string;
    avatar_url?: string;
    business_name?: string;
  };
  service?: {
    title?: string;
    retail_price?: string;
  };
}

interface RenewalNotification {
  id: string;
  notification_data: any;
  created_at: string;
  status: string;
}

export const PaymentScheduleManager = () => {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [notifications, setNotifications] = useState<RenewalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentSchedules();
    fetchRenewalNotifications();
  }, []);

  const fetchPaymentSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the payment schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('copay_payment_schedules')
        .select('*')
        .eq('vendor_id', user.id)
        .order('end_date', { ascending: true });

      if (schedulesError) throw schedulesError;

      // Then get related data separately
      const schedulesWithDetails = await Promise.all(
        (schedulesData || []).map(async (schedule) => {
          // Get co-pay request details
          const { data: coPayData } = await supabase
            .from('co_pay_requests')
            .select('agent_id, service_id')
            .eq('id', schedule.co_pay_request_id)
            .single();

          let agentProfile = null;
          let serviceData = null;

          if (coPayData) {
            // Get agent profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name, avatar_url, business_name')
              .eq('user_id', coPayData.agent_id)
              .single();

            // Get service data
            const { data: service } = await supabase
              .from('services')
              .select('title, retail_price')
              .eq('id', coPayData.service_id)
              .single();

            agentProfile = profileData;
            serviceData = service;
          }

          return {
            ...schedule,
            agent_profile: agentProfile,
            service: serviceData
          };
        })
      );

      setSchedules(schedulesWithDetails);
    } catch (error) {
      console.error('Error fetching payment schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load payment schedules",
        variant: "destructive"
      });
    }
  };

  const fetchRenewalNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('consultation_notifications')
        .select('*')
        .eq('vendor_id', user.id)
        .eq('notification_type', 'payment_schedule_renewal')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching renewal notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewalDecision = async (notificationId: string, scheduleId: string, action: 'approve' | 'decline') => {
    try {
      if (action === 'approve') {
        // Extend the payment schedule
        const schedule = schedules.find(s => s.id === scheduleId);
        if (schedule) {
          const currentEndDate = new Date(schedule.end_date);
          const newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + 12); // Extend by 12 months

          const { error: updateError } = await supabase
            .from('copay_payment_schedules')
            .update({
              end_date: newEndDate.toISOString().split('T')[0],
              status: 'renewed'
            })
            .eq('id', scheduleId);

          if (updateError) throw updateError;

          // Create a new schedule for the extended period
          const { data: { user } } = await supabase.auth.getUser();
          const { error: insertError } = await supabase
            .from('copay_payment_schedules')
            .insert({
              co_pay_request_id: schedule.co_pay_request_id,
              agent_id: schedule.agent_id,
              vendor_id: user?.id || schedule.vendor_id,
              payment_percentage: schedule.payment_percentage,
              start_date: currentEndDate.toISOString().split('T')[0],
              end_date: newEndDate.toISOString().split('T')[0],
              auto_renewal: schedule.auto_renewal,
              status: 'active'
            });

          if (insertError) throw insertError;

          toast({
            title: "Schedule Renewed ✅",
            description: `Payment schedule extended for another 12 months until ${format(newEndDate, 'MMM dd, yyyy')}`,
          });
        }
      } else {
        // Mark schedule as cancelled
        const { error: updateError } = await supabase
          .from('copay_payment_schedules')
          .update({ status: 'cancelled' })
          .eq('id', scheduleId);

        if (updateError) throw updateError;

        toast({
          title: "Renewal Declined",
          description: "Payment schedule will end as scheduled. Agent will be notified.",
          variant: "destructive"
        });
      }

      // Mark notification as processed
      const { error: notificationError } = await supabase
        .from('consultation_notifications')
        .update({ status: 'processed' })
        .eq('id', notificationId);

      if (notificationError) {
        console.error('Error updating notification:', notificationError);
      }

      // Refresh data
      await fetchPaymentSchedules();
      await fetchRenewalNotifications();

    } catch (error) {
      console.error('Error handling renewal decision:', error);
      toast({
        title: "Error",
        description: "Failed to process renewal decision",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const activeSchedules = schedules.filter(s => s.status === 'active');
  const expiringSchedules = schedules.filter(s => {
    const daysUntilExpiry = Math.ceil(
      (new Date(s.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return s.status === 'active' && daysUntilExpiry <= 30;
  });

  return (
    <div className="space-y-6">
      {/* Renewal Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Renewal Decisions Needed ({notifications.length})
          </h3>
          
          {notifications.map((notification) => (
            <Card key={notification.id} className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {notification.notification_data.agent_name} - {notification.notification_data.service_title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Current {notification.notification_data.current_percentage}% coverage expires in {notification.notification_data.days_until_expiry} days
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: {format(new Date(notification.notification_data.expires_on), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRenewalDecision(notification.id, notification.notification_data.schedule_id, 'decline')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      End Coverage
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRenewalDecision(notification.id, notification.notification_data.schedule_id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Renew 12 Months
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active Payment Schedules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Payment Schedules ({activeSchedules.length})
          </h3>
          {expiringSchedules.length > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {expiringSchedules.length} expiring soon
            </Badge>
          )}
        </div>

        {activeSchedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Payment Schedules</h3>
              <p className="text-gray-600">Approved co-pay requests will create payment schedules here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeSchedules.map((schedule) => {
              const daysUntilExpiry = Math.ceil(
                (new Date(schedule.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              const isExpiringSoon = daysUntilExpiry <= 30;

              return (
                <Card key={schedule.id} className={`${isExpiringSoon ? 'border-l-4 border-l-amber-500 bg-amber-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={schedule.agent_profile?.avatar_url} />
                          <AvatarFallback>
                            {schedule.agent_profile?.display_name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {schedule.agent_profile?.display_name || 'Unknown Agent'}
                          </h4>
                          <p className="text-sm text-gray-600">{schedule.service?.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {schedule.payment_percentage}% coverage
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Until {format(new Date(schedule.end_date), 'MMM dd, yyyy')}
                            </span>
                            {schedule.auto_renewal && (
                              <Badge variant="outline" className="text-xs">Auto-renewal</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge className={`${getStatusColor(schedule.status)} mb-2`}>
                          {getStatusIcon(schedule.status)}
                          <span className="ml-1 capitalize">{schedule.status}</span>
                        </Badge>
                        {isExpiringSoon && (
                          <div className="text-xs text-amber-600 font-medium">
                            Expires in {daysUntilExpiry} days
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};