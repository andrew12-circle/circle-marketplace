/**
 * Payload size optimization and timeout strategy for service saves
 */

export interface PayloadSizeInfo {
  sizeBytes: number;
  sizeKB: number;
  category: 'small' | 'medium' | 'large' | 'xlarge';
  recommendedTimeout: number;
  shouldChunk: boolean;
}

export interface OptimizedSaveOptions {
  timeoutMs?: number;
  retries?: number;
  source?: string;
}

/**
 * Analyze payload size and determine optimal save strategy
 */
export function analyzePayloadSize(payload: Record<string, any>): PayloadSizeInfo {
  const serialized = JSON.stringify(payload);
  const sizeBytes = new Blob([serialized]).size;
  const sizeKB = Math.round(sizeBytes / 1024 * 100) / 100;
  
  let category: PayloadSizeInfo['category'];
  let recommendedTimeout: number;
  let shouldChunk: boolean;
  
  if (sizeBytes < 5000) { // < 5KB
    category = 'small';
    recommendedTimeout = 8000; // 8 seconds
    shouldChunk = false;
  } else if (sizeBytes < 15000) { // 5-15KB
    category = 'medium';
    recommendedTimeout = 20000; // 20 seconds
    shouldChunk = false;
  } else if (sizeBytes < 50000) { // 15-50KB
    category = 'large';
    recommendedTimeout = 30000; // 30 seconds
    shouldChunk = true;
  } else { // > 50KB
    category = 'xlarge';
    recommendedTimeout = 45000; // 45 seconds
    shouldChunk = true;
  }
  
  return {
    sizeBytes,
    sizeKB,
    category,
    recommendedTimeout,
    shouldChunk
  };
}

/**
 * Extract chunked payloads for large saves
 */
export function chunkPayload(payload: Record<string, any>): {
  corePayload: Record<string, any>;
  mediaPayload: Record<string, any> | null;
  metadataPayload: Record<string, any> | null;
} {
  const { funnel_content, pricing_tiers, ...coreFields } = payload;
  
  // Core payload - essential service fields
  const corePayload = {
    ...coreFields,
    updated_at: new Date().toISOString()
  };
  
  // Media payload - funnel content with media
  let mediaPayload = null;
  if (funnel_content) {
    mediaPayload = { funnel_content };
  }
  
  // Metadata payload - pricing tiers
  let metadataPayload = null;
  if (pricing_tiers) {
    metadataPayload = { pricing_tiers };
  }
  
  return {
    corePayload,
    mediaPayload,
    metadataPayload
  };
}

/**
 * Optimize funnel content for storage
 */
export function optimizeFunnelContent(funnelContent: any): any {
  if (!funnelContent) return funnelContent;
  
  const optimized = { ...funnelContent };
  
  // Optimize media arrays by removing unnecessary data
  if (optimized.media && Array.isArray(optimized.media)) {
    optimized.media = optimized.media.map((item: any) => ({
      url: item.url,
      type: item.type,
      title: item.title || '',
      description: item.description || ''
    }));
  }
  
  // Remove empty or null values to reduce payload size
  Object.keys(optimized).forEach(key => {
    if (optimized[key] === null || optimized[key] === undefined || optimized[key] === '') {
      delete optimized[key];
    }
  });
  
  return optimized;
}

/**
 * Get save options based on payload analysis
 */
export function getSaveOptions(payload: Record<string, any>): OptimizedSaveOptions {
  const analysis = analyzePayloadSize(payload);
  
  console.log(`[PayloadOptimizer] Payload analysis:`, {
    size: `${analysis.sizeKB}KB`,
    category: analysis.category,
    timeout: `${analysis.recommendedTimeout}ms`,
    shouldChunk: analysis.shouldChunk
  });
  
  return {
    timeoutMs: analysis.recommendedTimeout,
    retries: analysis.category === 'xlarge' ? 2 : 3,
    source: `optimized-${analysis.category}`
  };
}