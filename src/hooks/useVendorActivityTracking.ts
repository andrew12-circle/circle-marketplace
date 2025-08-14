import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ActivityType = 
  | 'consultation_booking' 
  | 'service_save' 
  | 'service_purchase' 
  | 'funnel_view' 
  | 'contact_request' 
  | 'co_pay_request'
  | 'vendor_profile_view'
  | 'vendor_contact';

interface ActivityData {
  [key: string]: any;
}

export const useVendorActivityTracking = () => {
  const { toast } = useToast();

  const trackActivity = async (
    vendorId: string, 
    activityType: ActivityType, 
    activityData: ActivityData = {}
  ) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Don't track activity for unauthenticated users
        return null;
      }

      const { data, error } = await supabase.rpc('track_vendor_activity', {
        p_vendor_id: vendorId,
        p_activity_type: activityType,
        p_activity_data: activityData
      });

      if (error) {
        // If the error is due to agent_id constraint, just skip tracking
        if (error.code === '23502' && error.message.includes('agent_id')) {
          console.log('No agent profile found for tracking, skipping');
          return null;
        }
        throw error;
      }

      console.log(`Tracked activity: ${activityType} for vendor ${vendorId}`, activityData);
      return data;
    } catch (error) {
      console.error('Error tracking vendor activity:', error);
      // Don't show toast for tracking errors as they're background operations
      return null;
    }
  };

  const trackConsultationBooking = (vendorId: string, consultationData: any) => {
    return trackActivity(vendorId, 'consultation_booking', {
      consultation_date: consultationData.date,
      consultation_time: consultationData.time,
      service_type: consultationData.serviceType,
      contact_method: consultationData.contactMethod
    });
  };

  const trackServiceSave = (vendorId: string, serviceData: any) => {
    return trackActivity(vendorId, 'service_save', {
      service_id: serviceData.serviceId,
      service_title: serviceData.title,
      service_category: serviceData.category,
      saved_at: new Date().toISOString()
    });
  };

  const trackServicePurchase = (vendorId: string, purchaseData: any) => {
    return trackActivity(vendorId, 'service_purchase', {
      service_id: purchaseData.serviceId,
      service_title: purchaseData.title,
      price_paid: purchaseData.price,
      payment_method: purchaseData.paymentMethod,
      purchase_type: purchaseData.type // 'retail', 'pro', 'co_pay'
    });
  };

  const trackFunnelView = (vendorId: string, funnelData: any) => {
    return trackActivity(vendorId, 'funnel_view', {
      vendor_name: funnelData.vendorName,
      page_section: funnelData.section,
      time_spent: funnelData.timeSpent,
      referrer: document.referrer
    });
  };

  const trackContactRequest = (vendorId: string, contactData: any) => {
    return trackActivity(vendorId, 'contact_request', {
      contact_type: contactData.type, // 'email', 'phone', 'calendar'
      contact_value: contactData.value,
      message: contactData.message,
      lead_source: contactData.source
    });
  };

  const trackCoPayRequest = (vendorId: string, coPayData: any) => {
    return trackActivity(vendorId, 'co_pay_request', {
      service_id: coPayData.serviceId,
      requested_split: coPayData.requestedSplit,
      estimated_value: coPayData.estimatedValue,
      request_notes: coPayData.notes
    });
  };

  return {
    trackActivity,
    trackConsultationBooking,
    trackServiceSave,
    trackServicePurchase,
    trackFunnelView,
    trackContactRequest,
    trackCoPayRequest
  };
};