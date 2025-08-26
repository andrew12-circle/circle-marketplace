// Helper to delete duplicate Robert admin account
import { supabase } from '@/integrations/supabase/client';

export const deleteDuplicateRobertAccount = async () => {
  try {
    console.log('🗑️ Starting cleanup of duplicate Robert admin account');
    
    // Delete the robert@gocircle.org account (8559c5c1-25a5-4d53-9711-5c0f6e73513c)
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId: '8559c5c1-25a5-4d53-9711-5c0f6e73513c' }
    });

    if (error) {
      console.error('❌ Error invoking delete function:', error);
      throw error;
    }

    if (data.error) {
      console.error('❌ Delete function returned error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Successfully deleted duplicate Robert account:', data.message);
    return { success: true, message: data.message };
  } catch (error) {
    console.error('❌ Failed to delete duplicate account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Call this function to run the cleanup
// Note: This should only be run by an admin with proper permissions
export const runRobertAccountCleanup = async () => {
  console.log('🔧 Robert Admin Account Cleanup Tool');
  const result = await deleteDuplicateRobertAccount();
  
  if (result.success) {
    console.log('🎉 Cleanup completed successfully!');
    console.log('📧 Robert should now use: robert@circlenetwork.io');
  } else {
    console.log('💥 Cleanup failed:', result.error);
  }
  
  return result;
};