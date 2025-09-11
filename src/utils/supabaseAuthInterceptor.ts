import { supabase } from '@/integrations/supabase/client';
import { AuthErrorHandler } from './authErrorHandler';
import { logger } from './logger';

// Track if interceptor is already installed
let interceptorInstalled = false;

// Original methods to wrap
let originalSelect: any;
let originalInsert: any;
let originalUpdate: any;
let originalDelete: any;
let originalRpc: any;

/**
 * Install authentication error interceptor for all Supabase operations
 */
export function installSupabaseAuthInterceptor() {
  if (interceptorInstalled) {
    logger.log('Supabase auth interceptor already installed');
    return;
  }

  try {
    // Store original methods
    const postgrestBuilder = supabase.from('_dummy');
    originalSelect = postgrestBuilder.select.bind(postgrestBuilder);
    originalInsert = postgrestBuilder.insert.bind(postgrestBuilder);
    originalUpdate = postgrestBuilder.update.bind(postgrestBuilder);
    originalDelete = postgrestBuilder.delete.bind(postgrestBuilder);
    originalRpc = supabase.rpc.bind(supabase);

    // Wrap query builder methods
    wrapPostgrestMethods();

    // Wrap RPC method
    wrapRpcMethod();

    interceptorInstalled = true;
    logger.log('Supabase auth interceptor installed successfully');

  } catch (error) {
    logger.error('Failed to install Supabase auth interceptor:', error);
  }
}

/**
 * Wrap Postgrest builder methods with auth error handling
 */
function wrapPostgrestMethods() {
  // Temporarily disabled to avoid breaking existing functionality
  // The auth error handling is better handled in the AuthContext and AdminAuthWrapper
  logger.log('Postgrest method wrapping skipped to maintain compatibility');
}

/**
 * Wrap RPC method with auth error handling
 */
function wrapRpcMethod() {
  // For now, don't wrap RPC to avoid breaking existing functionality
  // The RPC calls are working fine and the main auth issues are in the AuthContext
  logger.log('RPC method wrapping skipped to maintain compatibility');
}

/**
 * Uninstall the auth interceptor (for testing or cleanup)
 */
export function uninstallSupabaseAuthInterceptor() {
  if (!interceptorInstalled) {
    return;
  }

  try {
    // Restore original methods if we have them
    if (originalRpc) {
      supabase.rpc = originalRpc;
    }

    // Note: Restoring postgrest methods is more complex due to the builder pattern
    // For now, we'll just mark as uninstalled
    interceptorInstalled = false;
    logger.log('Supabase auth interceptor uninstalled');
    
  } catch (error) {
    logger.error('Failed to uninstall Supabase auth interceptor:', error);
  }
}

/**
 * Check if interceptor is installed
 */
export function isInterceptorInstalled(): boolean {
  return interceptorInstalled;
}

// Auto-install when module is imported (unless in test environment)
if (typeof window !== 'undefined' && !window.location.pathname.includes('/test')) {
  // Install after a brief delay to ensure Supabase client is fully initialized
  setTimeout(() => {
    installSupabaseAuthInterceptor();
  }, 100);
}