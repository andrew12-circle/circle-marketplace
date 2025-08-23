import { initPerformanceOptimizations } from './performanceOptimizer';
import { taskScheduler } from './taskScheduler';

// Initialize all performance optimizations on app startup
export const initAppPerformance = () => {
  if (typeof window !== 'undefined') {
    // Use task scheduler to prevent blocking initial render
    taskScheduler.schedule(() => {
      initPerformanceOptimizations();
      
      // Add CSS containment for heavy components
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
      
      // Preload critical images after initial render
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