import { bulletproofSave } from '@/lib/bulletproofSave';
import { logger } from '@/utils/logger';
import { analyzePayloadSize, optimizeFunnelContent, chunkPayload, getSaveOptions } from './payloadOptimizer';

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
  private saveTimeouts = new Map<string, NodeJS.Timeout>();
  
  // Minimum time between saves (ms)
  private readonly SAVE_DEBOUNCE = 1000;
  // Maximum time to wait for a save (ms) - increased for better reliability
  private readonly SAVE_TIMEOUT = 20000;
  
  async save(serviceId: string, patch: Record<string, any>, source = 'unknown'): Promise<any> {
    logger.log(`🔒 ServiceSaveCoordinator: Save requested`, { serviceId, source, patchKeys: Object.keys(patch) });
    
    // Clear any existing timeout for this service
    const existingTimeout = this.saveTimeouts.get(serviceId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.saveTimeouts.delete(serviceId);
    }
    
    // If there's already an active save for this service, queue this one
    if (this.activeSaves.has(serviceId)) {
      logger.log(`🔄 ServiceSaveCoordinator: Queuing save (active save in progress)`, { serviceId });
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
    logger.log(`🚀 ServiceSaveCoordinator: Starting save execution`, { serviceId, source });
    
    const savePromise = this.performSave(serviceId, patch, source);
    this.activeSaves.set(serviceId, savePromise);
    
    // Set up timeout to prevent stuck saves
    const timeout = setTimeout(() => {
      logger.error(`⏰ ServiceSaveCoordinator: Save timeout, clearing active save`, { serviceId });
      this.activeSaves.delete(serviceId);
      this.saveTimeouts.delete(serviceId);
      // Process queue after timeout
      this.processQueue(serviceId).catch(err => 
        logger.error(`Error processing queue after timeout`, { serviceId, error: err })
      );
    }, this.SAVE_TIMEOUT);
    
    this.saveTimeouts.set(serviceId, timeout);
    
    try {
      const result = await savePromise;
      this.lastSaveTime.set(serviceId, Date.now());
      
      // Clear timeout since save completed successfully
      clearTimeout(timeout);
      this.saveTimeouts.delete(serviceId);
      
      // Process next item in queue
      await this.processQueue(serviceId);
      
      return result;
    } catch (error) {
      logger.error(`❌ ServiceSaveCoordinator: Save failed`, { serviceId, error });
      // Clear timeout on error
      clearTimeout(timeout);
      this.saveTimeouts.delete(serviceId);
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
    // Analyze payload size and optimize strategy
    const analysis = analyzePayloadSize(patch);
    const saveOptions = getSaveOptions(patch);
    
    logger.log(`💾 ServiceSaveCoordinator: Executing save`, {
      serviceId,
      source,
      payloadSize: `${analysis.sizeKB}KB`,
      category: analysis.category,
      timeout: `${analysis.recommendedTimeout}ms`,
      shouldChunk: analysis.shouldChunk
    });
    
    // Filter out undefined values and detect actual changes
    const cleanPatch = this.sanitizePatch(patch);
    
    if (Object.keys(cleanPatch).length === 0) {
      logger.log(`⚡ ServiceSaveCoordinator: No changes detected, skipping save`, { serviceId });
      return { ok: true, skipped: true };
    }
    
    // For large payloads, try chunked saving
    if (analysis.shouldChunk && analysis.sizeBytes > 15000) {
      return await this.performChunkedSave(serviceId, cleanPatch, source, saveOptions);
    }
    
    // Optimize patch for better performance
    let optimizedPatch = cleanPatch;
    if (optimizedPatch.funnel_content) {
      optimizedPatch.funnel_content = optimizeFunnelContent(optimizedPatch.funnel_content);
    }
    
    console.log('[ServiceSaveCoordinator] About to call bulletproofSave with patch:', {
      keys: Object.keys(optimizedPatch),
      originalSize: `${analysis.sizeKB}KB`,
      optimizedSize: `${analyzePayloadSize(optimizedPatch).sizeKB}KB`
    });
    
    const result = await bulletproofSave(serviceId, optimizedPatch);
    
    if (result.ok) {
      logger.log(`✅ ServiceSaveCoordinator: Save completed`, { serviceId, traceId: result.traceId });
    } else {
      // Enhanced error reporting for timeout vs actual failures
      const isTimeout = result.code === 'TIMEOUT' || result.error?.includes('timeout');
      logger.error(`❌ ServiceSaveCoordinator: Save ${isTimeout ? 'timed out' : 'failed'}`, { 
        serviceId, 
        error: result.error,
        code: result.code,
        possibleSuccess: isTimeout ? 'Save may have succeeded despite timeout' : false
      });
    }
    
    return result;
  }

  private async performChunkedSave(serviceId: string, patch: Record<string, any>, source: string, options: any): Promise<any> {
    logger.log(`🔄 ServiceSaveCoordinator: Attempting chunked save`, { serviceId, source });
    
    const { corePayload, mediaPayload, metadataPayload } = chunkPayload(patch);
    
    try {
      // Save core fields first (fastest)
      let result = await bulletproofSave(serviceId, this.sanitizePatch(corePayload));
      if (!result.ok) throw new Error(result.error);
      
      // Save media content if exists
      if (mediaPayload) {
        const optimizedMedia = { funnel_content: optimizeFunnelContent(mediaPayload.funnel_content) };
        result = await bulletproofSave(serviceId, this.sanitizePatch(optimizedMedia));
        if (!result.ok) throw new Error(result.error);
      }
      
      // Save metadata if exists
      if (metadataPayload) {
        result = await bulletproofSave(serviceId, this.sanitizePatch(metadataPayload));
        if (!result.ok) throw new Error(result.error);
      }
      
      logger.log(`✅ ServiceSaveCoordinator: Chunked save successful`, { serviceId, source });
      return result;
    } catch (error: any) {
      logger.error(`❌ ServiceSaveCoordinator: Chunked save failed, falling back to single save`, { 
        serviceId, 
        source, 
        error: error.message 
      });
      
      // Fallback to single optimized save
      const optimized = this.sanitizePatch(patch);
      if (optimized.funnel_content) {
        optimized.funnel_content = optimizeFunnelContent(optimized.funnel_content);
      }
      
      return await bulletproofSave(serviceId, optimized);
    }
  }
  
  private optimizePatchForMedia(patch: Record<string, any>): Record<string, any> {
    const optimized = { ...patch };
    
    // Optimize funnel_content for large media payloads
    if (optimized.funnel_content && typeof optimized.funnel_content === 'object') {
      const content = optimized.funnel_content;
      const contentStr = JSON.stringify(content);
      
      // Log size info for debugging
      if (contentStr.length > 50000) {
        logger.log(`📊 Large funnel_content detected`, { 
          size: contentStr.length,
          hasMediaItems: content.mediaItems?.length || 0
        });
      }
      
      // Ensure JSON is properly structured for PostgreSQL
      optimized.funnel_content = content;
    }
    
    return optimized;
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
    
    // Clear timeout if any
    const timeout = this.saveTimeouts.get(serviceId);
    if (timeout) {
      clearTimeout(timeout);
      this.saveTimeouts.delete(serviceId);
    }
    
    // Clear active save
    this.activeSaves.delete(serviceId);
  }
}

export const serviceSaveCoordinator = new ServiceSaveCoordinator();