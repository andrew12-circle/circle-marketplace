import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorRecord {
  id: string;
  name: string;
  approval_status: string;
  is_active: boolean;
  is_verified: boolean;
  auto_score?: number;
  verification_notes?: string;
}

export const useVendorOnboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendorRecord, setVendorRecord] = useState<VendorRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkOrCreateVendorRecord();
    }
  }, [user]);

  const checkOrCreateVendorRecord = async () => {
    if (!user) return;

    try {
      // First check if vendor record exists
      const { data: existingVendor, error: fetchError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingVendor) {
        setVendorRecord(existingVendor);
        
        // If pending, trigger automated screening
        if (existingVendor.approval_status === 'pending') {
          await triggerAutomatedScreening(user.id);
        }
      } else {
        // Create vendor record if it doesn't exist
        await createVendorRecord();
      }
    } catch (error) {
      console.error('Error checking vendor record:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVendorRecord = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          id: user.id,
          name: user.user_metadata?.company_name || user.user_metadata?.name || 'New Vendor',
          contact_email: user.email,
          approval_status: 'pending',
          is_active: false,
          is_verified: false,
          auto_score: 0
        })
        .select()
        .single();

      if (error) throw error;

      setVendorRecord(data);
      
      // Trigger automated screening
      await triggerAutomatedScreening(user.id);
      
    } catch (error) {
      console.error('Error creating vendor record:', error);
      toast({
        title: "Setup Error",
        description: "Failed to set up vendor profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const triggerAutomatedScreening = async (vendorId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-vendor-onboarding', {
        body: { vendorId }
      });

      if (error) {
        console.error('Error running automated screening:', error);
        return;
      }

      // Refresh vendor record after screening
      const { data: updatedVendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (updatedVendor) {
        setVendorRecord(updatedVendor);
        
        // Show appropriate message based on result
        if (updatedVendor.approval_status === 'auto_approved') {
          toast({
            title: "Welcome!",
            description: "Your vendor profile has been automatically approved. You can now start creating services.",
          });
        } else if (updatedVendor.approval_status === 'needs_review') {
          toast({
            title: "Application Under Review",
            description: "Your vendor application is being reviewed by our team. We'll notify you once it's approved.",
          });
        }
      }
    } catch (error) {
      console.error('Error triggering automated screening:', error);
    }
  };

  const isApproved = vendorRecord?.approval_status === 'approved' || vendorRecord?.approval_status === 'auto_approved';
  const isActive = vendorRecord?.is_active === true;
  const isPending = vendorRecord?.approval_status === 'pending';
  const needsReview = vendorRecord?.approval_status === 'needs_review';
  const isRejected = vendorRecord?.approval_status === 'rejected';

  return {
    vendorRecord,
    loading,
    isApproved,
    isActive,
    isPending,
    needsReview,
    isRejected,
    refreshVendorRecord: checkOrCreateVendorRecord
  };
};