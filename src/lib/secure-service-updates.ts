import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Admin allowlist for immediate access (consistent across all admin components)
const ADMIN_ALLOWLIST = ['robert@circlenetwork.io', 'andrew@heisleyteam.com'];

export interface ServiceUpdateOptions {
  batchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
  validateAdmin?: boolean;
  showProgress?: boolean;
}

export interface BulkUpdateResult {
  success: boolean;
  totalUpdated: number;
  totalFailed: number;
  errors: Array<{ id: string; error: string }>;
}

export class SecureServiceUpdater {
  private static readonly DEFAULT_BATCH_SIZE = 10;
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly DEFAULT_RETRY_DELAY = 1000;
  private static readonly RATE_LIMIT_DELAY = 100; // ms between requests

  /**
   * Validates admin access before allowing service updates
   * Uses admin allowlist for immediate access, falls back to RPC with timeout
   */
  private static async validateAdminAccess(): Promise<boolean> {
    try {
      // PRIORITY 1: Check admin allowlist FIRST - immediate access
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email && ADMIN_ALLOWLIST.includes(user.email.toLowerCase())) {
        console.log('SecureServiceUpdater: Admin allowlist access granted', { email: user.email });
        return true;
      }
      
      // PRIORITY 2: For non-allowlisted users, check with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Admin verification timeout')), 3000);
      });
      
      const adminPromise = supabase.rpc('get_user_admin_status');
      
      const { data: isAdmin, error } = await Promise.race([adminPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Admin validation error:', error);
        throw new Error('Failed to verify admin access');
      }
      
      if (!isAdmin) {
        throw new Error('Admin access required for service updates');
      }
      
      return true;
    } catch (error) {
      console.error('Admin access validation failed:', error);
      toast({
        title: 'Access Denied',
        description: error instanceof Error ? error.message : 'Admin access required',
        variant: 'destructive',
      });
      return false;
    }
  }

  /**
   * Updates a single service with retry logic and admin validation
   */
  static async updateService(
    serviceId: string, 
    updates: Record<string, any>,
    options: ServiceUpdateOptions = {}
  ): Promise<boolean> {
    const {
      retryAttempts = this.DEFAULT_RETRY_ATTEMPTS,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      validateAdmin = true
    } = options;

    // Validate admin access if required
    if (validateAdmin && !(await this.validateAdminAccess())) {
      return false;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`Updating service ${serviceId} (attempt ${attempt}/${retryAttempts})`);
        
        const { error } = await supabase
          .from('services')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', serviceId);

        if (error) throw error;

        console.log(`Successfully updated service ${serviceId}`);
        return true;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Service update attempt ${attempt} failed for ${serviceId}:`, lastError);
        
        if (attempt < retryAttempts) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    console.error(`Failed to update service ${serviceId} after ${retryAttempts} attempts:`, lastError);
    toast({
      title: 'Update Failed',
      description: `Service update failed: ${lastError?.message || 'Unknown error'}`,
      variant: 'destructive',
    });

    return false;
  }

  /**
   * Updates multiple services in batches with comprehensive error handling
   */
  static async bulkUpdateServices(
    serviceIds: string[],
    updates: Record<string, any>,
    options: ServiceUpdateOptions = {}
  ): Promise<BulkUpdateResult> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      validateAdmin = true,
      showProgress = true
    } = options;

    // Validate admin access if required
    if (validateAdmin && !(await this.validateAdminAccess())) {
      return {
        success: false,
        totalUpdated: 0,
        totalFailed: serviceIds.length,
        errors: serviceIds.map(id => ({ id, error: 'Admin access required' }))
      };
    }

    const result: BulkUpdateResult = {
      success: true,
      totalUpdated: 0,
      totalFailed: 0,
      errors: []
    };

    // Process in batches to avoid overwhelming the system
    const batches = this.createBatches(serviceIds, batchSize);
    
    if (showProgress) {
      toast({
        title: 'Bulk Update Started',
        description: `Processing ${serviceIds.length} services in ${batches.length} batches`,
      });
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} services)`);

      const batchPromises = batch.map(async (serviceId) => {
        // Rate limiting: small delay between requests
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
        
        const success = await this.updateService(serviceId, updates, { 
          ...options, 
          validateAdmin: false // Already validated
        });
        
        if (success) {
          result.totalUpdated++;
        } else {
          result.totalFailed++;
          result.errors.push({ 
            id: serviceId, 
            error: 'Update failed after retries' 
          });
        }
      });

      // Wait for batch to complete before proceeding
      await Promise.all(batchPromises);

      if (showProgress) {
        toast({
          title: 'Progress Update',
          description: `Completed batch ${i + 1}/${batches.length}. Updated: ${result.totalUpdated}, Failed: ${result.totalFailed}`,
        });
      }

      // Small delay between batches to be gentle on the system
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Final result
    result.success = result.totalFailed === 0;

    if (showProgress) {
      toast({
        title: result.success ? 'Bulk Update Complete' : 'Bulk Update Completed with Errors',
        description: `Updated: ${result.totalUpdated}, Failed: ${result.totalFailed}`,
        variant: result.success ? 'default' : 'destructive',
      });
    }

    if (result.errors.length > 0) {
      console.error('Bulk update errors:', result.errors);
    }

    return result;
  }

  /**
   * Toggles service visibility with admin validation and proper error handling
   */
  static async toggleServiceVisibility(
    serviceId: string,
    currentState: boolean,
    options: ServiceUpdateOptions = {}
  ): Promise<boolean> {
    return this.updateService(
      serviceId,
      { is_active: !currentState },
      options
    );
  }

  /**
   * Updates service compliance information with validation
   */
  static async updateServiceCompliance(
    serviceId: string,
    complianceData: {
      is_respa_regulated?: boolean;
      respa_risk_level?: string;
      respa_split_limit?: number;
      respa_compliance_notes?: string;
    },
    options: ServiceUpdateOptions = {}
  ): Promise<boolean> {
    // Validate compliance data
    const updates: Record<string, any> = {};
    
    if (complianceData.is_respa_regulated !== undefined) {
      updates.is_respa_regulated = complianceData.is_respa_regulated;
    }
    
    if (complianceData.respa_risk_level) {
      updates.respa_risk_level = complianceData.respa_risk_level;
    }
    
    if (complianceData.respa_split_limit !== undefined) {
      updates.respa_split_limit = complianceData.respa_split_limit;
    }
    
    if (complianceData.respa_compliance_notes) {
      updates.respa_compliance_notes = complianceData.respa_compliance_notes;
    }

    return this.updateService(serviceId, updates, options);
  }

  /**
   * Helper method to create batches from an array
   */
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Health check for the update system
   */
  static async healthCheck(): Promise<{
    adminAccess: boolean;
    databaseConnection: boolean;
    overallHealth: boolean;
  }> {
    let adminAccess = false;
    let databaseConnection = false;

    try {
      // Check database connection
      const { data, error } = await supabase.from('services').select('id').limit(1);
      databaseConnection = !error;
      
      // Check admin access
      adminAccess = await this.validateAdminAccess();
      
    } catch (error) {
      console.error('Health check failed:', error);
    }

    const overallHealth = adminAccess && databaseConnection;
    
    console.log('Service updater health check:', {
      adminAccess,
      databaseConnection,
      overallHealth
    });

    return { adminAccess, databaseConnection, overallHealth };
  }
}

// Convenience exports for common operations
export const updateService = SecureServiceUpdater.updateService.bind(SecureServiceUpdater);
export const bulkUpdateServices = SecureServiceUpdater.bulkUpdateServices.bind(SecureServiceUpdater);
export const toggleServiceVisibility = SecureServiceUpdater.toggleServiceVisibility.bind(SecureServiceUpdater);
export const updateServiceCompliance = SecureServiceUpdater.updateServiceCompliance.bind(SecureServiceUpdater);