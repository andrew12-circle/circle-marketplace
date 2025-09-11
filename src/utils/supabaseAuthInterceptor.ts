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
  // We can't easily intercept all Postgrest methods due to how the builder pattern works
  // Instead, we'll patch the client's from method to return wrapped builders
  const originalFrom = supabase.from.bind(supabase);
  
  supabase.from = function(table: string) {
    const builder = originalFrom(table);
    
    // Wrap the builder's promise methods
    const originalThen = builder.then?.bind(builder);
    const originalCatch = builder.catch?.bind(builder);
    
    if (originalThen) {
      builder.then = function(onFulfilled?: any, onRejected?: any) {
        return originalThen(
          onFulfilled,
          async (error: any) => {
            // Handle auth errors
            const handled = await AuthErrorHandler.handleAuthError(
              error,
              `supabase_query_${table}`,
              {
                showToast: false // Let the calling code decide on toasts
              }
            );
            
            // If we handled the error (like session refresh), we might want to retry
            if (handled && error?.message?.includes('session')) {
              logger.log('Auth error handled, original error will still be thrown for retry logic');
            }
            
            // Always call the original rejection handler
            if (onRejected) {
              return onRejected(error);
            }
            throw error;
          }
        );
      };
    }
    
    if (originalCatch) {
      builder.catch = function(onRejected: any) {
        return originalCatch(async (error: any) => {
          await AuthErrorHandler.handleAuthError(
            error,
            `supabase_query_${table}_catch`,
            {
              showToast: false
            }
          );
          
          return onRejected(error);
        });
      };
    }
    
    return builder;
  };
}

/**
 * Wrap RPC method with auth error handling
 */
function wrapRpcMethod() {
  supabase.rpc = function(fn: string, args?: any, options?: any) {
    const promise = originalRpc(fn, args, options);
    
    return promise.catch(async (error: any) => {
      await AuthErrorHandler.handleAuthError(
        error,
        `supabase_rpc_${fn}`,
        {
          showToast: false
        }
      );
      
      // Re-throw the error so calling code can handle it
      throw error;
    });
  };
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