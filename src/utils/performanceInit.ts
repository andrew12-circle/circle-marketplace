import { initPerformanceOptimizations } from './performanceOptimizer';
import { taskScheduler } from './taskScheduler';
import { initializeAppWithPriority, deferUntilIdle } from './fidOptimizer';
import { initNetworkOptimizations } from './networkOptimizer';
import { optimizeCSS } from './cssOptimizer';
import { initJavaScriptOptimization } from './jsOptimizer';
import { initRenderBlockingOptimizations } from './renderBlockingOptimizer';

// Initialize all performance optimizations on app startup with FID priority
export const initAppPerformance = () => {
  if (typeof window !== 'undefined') {
    // Eliminate render blocking resources first
    initRenderBlockingOptimizations();
    
    // Optimize network dependency chains
    initNetworkOptimizations();
    
    // Initialize JavaScript optimization for conditional loading
    initJavaScriptOptimization();
    
    // Immediately enable input responsiveness
    document.body.style.pointerEvents = 'auto';
    
    // Initialize with priority order for FID optimization
    initializeAppWithPriority();
    
    // Break up heavy initialization into smaller tasks
    taskScheduler.schedule(() => {
      initPerformanceOptimizations();
    });
    
    // Defer CSS optimizations to not block initial interactions
    taskScheduler.schedule(() => {
      const style = document.createElement('style');
      style.textContent = `
        /* CSS containment for performance */
        .marketplace-grid {
          contain: layout style paint;
        }
        
        .service-card {
          contain: layout style;
          content-visibility: auto;
          contain-intrinsic-size: 300px 350px;
        }
        
        .vendor-card {
          contain: layout style;
          content-visibility: auto;
          contain-intrinsic-size: 300px 250px;
        }
        
        /* Optimize heavy components */
        .top-deals-carousel,
        .category-blocks {
          contain: layout style;
          content-visibility: auto;
        }
        
        /* Reduce layout thrashing */
        * {
          transform-origin: center;
          backface-visibility: hidden;
        }
        
        /* GPU acceleration for animations */
        .card:hover {
          will-change: transform, box-shadow;
        }
      `;
      document.head.appendChild(style);
    });
    
    // Defer CSS optimization until after critical path
    deferUntilIdle(() => {
      optimizeCSS();
      
      const criticalImages = [
        'https://storage.googleapis.com/msgsndr/UjxJODh2Df0UKjTnKpcP/media/68255d47c398f6cc6978ed74.png'
      ];
      
      criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    });
  }
};