import { nanoid } from 'nanoid';
import { supabase } from "@/integrations/supabase/client";

export interface SaveOperation {
  traceId: string;
  serviceId: string;
  patch: Record<string, any>;
  expectedVersion?: number;
}

export interface SaveResult {
  ok: boolean;
  traceId: string;
  error?: string;
  code?: string;
  currentVersion?: number;
}

const SAVE_TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1000, 2000]; // Exponential backoff

// Single-flight save queue per service
const saveQueues = new Map<string, Promise<SaveResult>>();
const saveLogs: Array<{
  traceId: string;
  serviceId: string;
  timestamp: number;
  operation: string;
  duration?: number;
  error?: string;
}> = [];

function log(traceId: string, serviceId: string, operation: string, error?: string, duration?: number) {
  saveLogs.push({
    traceId,
    serviceId,
    timestamp: Date.now(),
    operation,
    error,
    duration
  });
  
  // Keep only last 200 entries
  if (saveLogs.length > 200) {
    saveLogs.splice(0, saveLogs.length - 200);
  }
  
  console.log(`[BulletproofSave] ${operation}`, {
    traceId,
    serviceId,
    error,
    duration: duration ? `${duration}ms` : undefined
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  let isResolved = false;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        console.log(`[withTimeout] Timeout fired after ${timeoutMs}ms`);
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([
      promise.then(result => {
        isResolved = true;
        clearTimeout(timeoutId);
        return result;
      }).catch(error => {
        isResolved = true;
        clearTimeout(timeoutId);
        throw error;
      }),
      timeoutPromise
    ]);
    
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function executeSaveWithRetries(operation: SaveOperation): Promise<SaveResult> {
  const { traceId, serviceId, patch } = operation;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const startTime = performance.now();
    
    try {
      log(traceId, serviceId, `attempt_${attempt + 1}_start`);
      
      // Apply timeout wrapper to the database operation to prevent indefinite hanging
      const dbOperation = async () => {
        console.log(`[BulletproofSave] Starting database operation for ${serviceId}`);
        console.log(`[BulletproofSave] Patch keys:`, Object.keys(patch));
        console.log(`[BulletproofSave] Patch size:`, JSON.stringify(patch).length);
        
        const startDbTime = performance.now();
        const result = await supabase
          .from('services')
          .update(patch)
          .eq('id', serviceId)
          .select('id')
          .single();
        
        const dbDuration = Math.round(performance.now() - startDbTime);
        console.log(`[BulletproofSave] Database operation completed in ${dbDuration}ms`);
        
        return result;
      };
      
      console.log(`[BulletproofSave] Calling withTimeout with ${SAVE_TIMEOUT_MS}ms timeout`);
      const { data, error } = await withTimeout(dbOperation(), SAVE_TIMEOUT_MS);
      
      const duration = Math.round(performance.now() - startTime);
      
      if (error) {
        log(traceId, serviceId, `attempt_${attempt + 1}_db_error`, error.message, duration);
        
        if (attempt === MAX_RETRIES - 1) {
          return {
            ok: false,
            traceId,
            error: error.message,
            code: error.code || 'DATABASE_ERROR'
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }
      
      log(traceId, serviceId, `attempt_${attempt + 1}_success`, undefined, duration);
      
      return {
        ok: true,
        traceId
      };
      
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      log(traceId, serviceId, `attempt_${attempt + 1}_error`, errorMessage, duration);
      
      // Special handling for timeout errors - they might have succeeded
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        log(traceId, serviceId, `attempt_${attempt + 1}_timeout_detected`, 'Save may have succeeded despite timeout', duration);
      }
      
      if (attempt === MAX_RETRIES - 1) {
        return {
          ok: false,
          traceId,
          error: errorMessage,
          code: errorMessage.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR'
        };
      }
      
      // Wait before retry, with longer delay for timeouts
      const delay = errorMessage.includes('timeout') ? RETRY_DELAYS[attempt] * 2 : RETRY_DELAYS[attempt];
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    ok: false,
    traceId,
    error: 'Max retries exceeded',
    code: 'MAX_RETRIES_EXCEEDED'
  };
}

export async function bulletproofSave(serviceId: string, patch: Record<string, any>): Promise<SaveResult> {
  const traceId = nanoid(8);
  
  // Check if there's already a save in progress for this service
  const existingOperation = saveQueues.get(serviceId);
  if (existingOperation) {
    log(traceId, serviceId, 'queued_behind_existing');
    await existingOperation; // Wait for existing to complete
  }
  
  // Filter out undefined values
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([_, value]) => value !== undefined)
  );
  
  if (Object.keys(cleanPatch).length === 0) {
    log(traceId, serviceId, 'no_changes_to_save');
    return {
      ok: false,
      traceId,
      error: 'No valid fields to update',
      code: 'NO_CHANGES'
    };
  }
  
  const operation: SaveOperation = {
    traceId,
    serviceId,
    patch: cleanPatch
  };
  
  // Create the save promise and store it
  const savePromise = executeSaveWithRetries(operation);
  saveQueues.set(serviceId, savePromise);
  
  try {
    const result = await savePromise;
    return result;
  } finally {
    // Clean up the queue
    saveQueues.delete(serviceId);
  }
}

export function getSaveLogs(): typeof saveLogs {
  return [...saveLogs];
}

export function clearSaveLogs(): void {
  saveLogs.length = 0;
}

export function isServiceSaving(serviceId: string): boolean {
  return saveQueues.has(serviceId);
}
