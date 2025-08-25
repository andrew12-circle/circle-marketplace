// CSS optimization utilities - simplified for safety
export const optimizeCSS = () => {
  if (typeof window === 'undefined') return;
  
  // Only add safe optimizations without deleting existing CSS rules
  console.log('CSS optimization: Using safe containment strategies only');
};

// Load CSS conditionally based on component usage
export const loadComponentCSS = (componentName: string) => {
  if (typeof window === 'undefined') return;

  const cssMap: Record<string, string> = {
    'dashboard': '/assets/dashboard.css',
    'marketplace': '/assets/marketplace.css', 
    'academy': '/assets/academy.css',
    'auth': '/assets/auth.css'
  };

  const cssFile = cssMap[componentName];
  if (!cssFile) return;

  // Check if CSS is already loaded
  const existingLink = document.querySelector(`link[href="${cssFile}"]`);
  if (existingLink) return;

  // Load CSS asynchronously
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssFile;
  link.media = 'all';
  document.head.appendChild(link);
};

// Critical CSS extraction for above-the-fold content
export const extractCriticalCSS = () => {
  if (typeof window === 'undefined') return;

  const criticalSelectors = [
    '.container',
    '.hero-content', 
    '.marketplace-grid',
    '.service-card',
    '.btn',
    '.text-3xl',
    '.text-gray-600',
    '.mb-4',
    '.mb-8', 
    '.mb-12'
  ];

  const criticalRules: string[] = [];
  const sheets = Array.from(document.styleSheets);
  
  sheets.forEach(sheet => {
    try {
      if (sheet.href && !sheet.href.includes(window.location.origin)) {
        return;
      }
      
      const rules = Array.from(sheet.cssRules || []);
      
      rules.forEach(rule => {
        if (rule.type === CSSRule.STYLE_RULE) {
          const styleRule = rule as CSSStyleRule;
          
          // Check if this rule matches critical selectors
          const isCritical = criticalSelectors.some(selector => 
            styleRule.selectorText.includes(selector)
          );
          
          if (isCritical) {
            criticalRules.push(styleRule.cssText);
          }
        }
      });
    } catch (e) {
      // CORS or other error, skip
    }
  });

  return criticalRules.join('\n');
};