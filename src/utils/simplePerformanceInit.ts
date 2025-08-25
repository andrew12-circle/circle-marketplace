import { taskScheduler } from './taskScheduler';
import { initializeAppWithPriority, deferUntilIdle } from './fidOptimizer';

// Simplified performance initialization without risky optimizations
export const initAppPerformance = () => {
  if (typeof window === 'undefined') return;
  
  // Initialize with priority order for FID optimization
  initializeAppWithPriority();
  
  // Break up heavy initialization into smaller tasks
  taskScheduler.schedule(() => {
    // Basic CSS containment for performance
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
      
      /* GPU acceleration for animations */
      .card:hover {
        will-change: transform, box-shadow;
      }
    `;
    document.head.appendChild(style);
  });
  
  // Defer critical image preloading
  deferUntilIdle(() => {
    const criticalImages = [
      'https://storage.googleapis.com/msgsndr/UjxJODh2Df0UKjTnKpcP/media/68255d47c398f6cc6978ed74.png'
    ];
    
    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  });
};