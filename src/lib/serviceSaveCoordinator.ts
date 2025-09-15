import { bulletproofSave } from '@/lib/bulletproofSave';
import { logger } from '@/utils/logger';

interface SaveOperation {
  serviceId: string;
  patch: Record<string, any>;
  source: string;
  timestamp: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

class ServiceSaveCoordinator {
  private activeSaves = new Map<string, Promise<any>>();
  private saveQueue = new Map<string, SaveOperation[]>();
  private lastSaveTime = new Map<string, number>();
  
  // Minimum time between saves (ms)
  private readonly SAVE_DEBOUNCE = 1000;
  
  async save(serviceId: string, patch: Record<string, any>, source = 'unknown'): Promise<any> {
    logger.log(`🔒 ServiceSaveCoordinator: Save requested`, { serviceId, source, patchKeys: Object.keys(patch) });
    
    // If there's already an active save for this service, queue this one
    if (this.activeSaves.has(serviceId)) {
      return this.queueSave(serviceId, patch, source);
    }
    
    // Check if we need to debounce
    const lastSave = this.lastSaveTime.get(serviceId) || 0;
    const timeSinceLastSave = Date.now() - lastSave;
    
    if (timeSinceLastSave < this.SAVE_DEBOUNCE) {
      logger.log(`⏳ ServiceSaveCoordinator: Debouncing save for ${this.SAVE_DEBOUNCE - timeSinceLastSave}ms`, { serviceId });
      await new Promise(resolve => setTimeout(resolve, this.SAVE_DEBOUNCE - timeSinceLastSave));
    }
    
    return this.executeSave(serviceId, patch, source);
  }
  
  private async queueSave(serviceId: string, patch: Record<string, any>, source: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.saveQueue.has(serviceId)) {
        this.saveQueue.set(serviceId, []);
      }
      
      const queue = this.saveQueue.get(serviceId)!;
      
      // Merge with existing queued patch if any
      if (queue.length > 0) {
        const lastOp = queue[queue.length - 1];
        lastOp.patch = { ...lastOp.patch, ...patch };
        lastOp.resolve = resolve;
        lastOp.reject = reject;
        logger.log(`🔄 ServiceSaveCoordinator: Merged with existing queued save`, { serviceId });
      } else {
        queue.push({
          serviceId,
          patch,
          source,
          timestamp: Date.now(),
          resolve,
          reject
        });
      }
    });
  }
  
  private async executeSave(serviceId: string, patch: Record<string, any>, source: string): Promise<any> {
    const savePromise = this.performSave(serviceId, patch, source);
    this.activeSaves.set(serviceId, savePromise);
    
    try {
      const result = await savePromise;
      this.lastSaveTime.set(serviceId, Date.now());
      
      // Process next item in queue
      await this.processQueue(serviceId);
      
      return result;
    } catch (error) {
      logger.error(`❌ ServiceSaveCoordinator: Save failed`, { serviceId, error });
      throw error;
    } finally {
      this.activeSaves.delete(serviceId);
    }
  }
  
  private async processQueue(serviceId: string): Promise<void> {
    const queue = this.saveQueue.get(serviceId);
    if (!queue || queue.length === 0) {
      return;
    }
    
    const nextOp = queue.shift()!;
    this.saveQueue.set(serviceId, queue);
    
    try {
      const result = await this.executeSave(serviceId, nextOp.patch, nextOp.source);
      nextOp.resolve(result);
    } catch (error) {
      nextOp.reject(error);
    }
  }
  
  private async performSave(serviceId: string, patch: Record<string, any>, source: string): Promise<any> {
    logger.log(`💾 ServiceSaveCoordinator: Executing save`, { serviceId, source });
    
    // Filter out undefined values and detect actual changes
    const cleanPatch = this.sanitizePatch(patch);
    
    if (Object.keys(cleanPatch).length === 0) {
      logger.log(`⚡ ServiceSaveCoordinator: No changes detected, skipping save`, { serviceId });
      return { ok: true, skipped: true };
    }
    
    const result = await bulletproofSave(serviceId, cleanPatch);
    
    if (result.ok) {
      logger.log(`✅ ServiceSaveCoordinator: Save completed`, { serviceId, traceId: result.traceId });
    } else {
      logger.error(`❌ ServiceSaveCoordinator: Save failed`, { serviceId, error: result.error });
    }
    
    return result;
  }
  
  private sanitizePatch(patch: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(patch)) {
      // Skip undefined values
      if (value === undefined) continue;
      
      // Convert empty strings to null for optional fields
      if (value === '') {
        clean[key] = null;
      } else {
        clean[key] = value;
      }
    }
    
    return clean;
  }
  
  // Check if a service is currently being saved
  isSaving(serviceId: string): boolean {
    return this.activeSaves.has(serviceId) || (this.saveQueue.get(serviceId)?.length || 0) > 0;
  }
  
  // Get save status for debugging
  getSaveStatus(serviceId: string) {
    return {
      isSaving: this.isSaving(serviceId),
      queueLength: this.saveQueue.get(serviceId)?.length || 0,
      lastSaveTime: this.lastSaveTime.get(serviceId)
    };
  }
  
  // Cancel all pending saves for a service
  cancelPendingSaves(serviceId: string): void {
    const queue = this.saveQueue.get(serviceId);
    if (queue) {
      queue.forEach(op => op.reject(new Error('Save cancelled')));
      this.saveQueue.delete(serviceId);
    }
  }
}

export const serviceSaveCoordinator = new ServiceSaveCoordinator();