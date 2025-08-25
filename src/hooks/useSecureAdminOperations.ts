import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminOperationResult {
  success: boolean;
  message: string;
  error?: string;
}

export const useSecureAdminOperations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const verifyAdminOperation = async (
    operationType: string, 
    targetUserId: string
  ): Promise<AdminOperationResult> => {
    try {
      // Use the enhanced safe admin verification
      const { data, error } = await supabase.rpc('verify_admin_operation_request', {
        operation_type: operationType,
        target_user_id: targetUserId
      });

      if (error) throw error;
      
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid response from server');
      }
      
      return data as unknown as AdminOperationResult;
    } catch (error) {
      console.error('Admin verification error:', error);
      return {
        success: false,
        message: 'Failed to verify admin operation',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const secureProfileUpdate = async (
    targetUserId: string, 
    updateData: Record<string, any>
  ): Promise<AdminOperationResult> => {
    setLoading(true);
    
    try {
      // First verify the operation
      const verification = await verifyAdminOperation('profile_update', targetUserId);
      
      if (!verification.success) {
        toast({
          title: 'Security Check Failed',
          description: verification.message,
          variant: 'destructive',
        });
        return verification;
      }

      // Perform the secure update through our enhanced database function
      const { data, error } = await supabase.rpc('secure_profile_update', {
        target_user_id: targetUserId,
        update_data: updateData
      });

      if (error) throw error;

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid response from server');
      }

      const result = data as unknown as AdminOperationResult;
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        // Handle specific error cases
        if (result.error === 'user_not_found') {
          toast({
            title: 'User Profile Not Found',
            description: 'This user exists in auth but has no profile record. Contact support to resolve this issue.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Operation Failed',
            description: result.message || 'Unknown error occurred',
            variant: 'destructive',
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Secure update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    const confirmMessage = !currentStatus 
      ? "⚠️ SECURITY WARNING: You are about to grant admin privileges to this user. This action will be logged and audited. Are you absolutely sure?"
      : "⚠️ SECURITY WARNING: You are about to remove admin privileges from this user. This action will be logged and audited. Are you absolutely sure?";
    
    if (!window.confirm(confirmMessage)) {
      return { success: false, message: 'Operation cancelled by user' };
    }

    return await secureProfileUpdate(userId, { is_admin: !currentStatus });
  };

  const toggleCreatorStatus = async (userId: string, currentStatus: boolean) => {
    const updates: any = { is_creator: !currentStatus };
    
    if (!currentStatus) {
      updates.creator_joined_at = new Date().toISOString();
    } else {
      updates.creator_joined_at = null;
      updates.creator_verified = false;
    }

    return await secureProfileUpdate(userId, updates);
  };

  const toggleVerificationStatus = async (userId: string, currentStatus: boolean) => {
    return await secureProfileUpdate(userId, { creator_verified: !currentStatus });
  };

  return {
    loading,
    verifyAdminOperation,
    secureProfileUpdate,
    toggleAdminStatus,
    toggleCreatorStatus,
    toggleVerificationStatus
  };
};