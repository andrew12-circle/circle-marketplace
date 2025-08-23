// Tree shaking optimization configuration
export const treeShakingConfig = {
  // Mark unused imports for elimination
  unusedExports: [
    // Recharts components not used on homepage
    'LineChart', 'BarChart', 'PieChart', 'AreaChart', 'ScatterChart',
    
    // Radix components not immediately needed
    'AlertDialog', 'Accordion', 'ContextMenu', 'Menubar', 'NavigationMenu',
    
    // Form components for later use
    'Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl',
    
    // Date utilities not immediately needed
    'DatePicker', 'Calendar', 'DateRange',
    
    // Analytics and admin features
    'Analytics', 'Dashboard', 'Reports',
    
    // Payment processing
    'StripeElements', 'PaymentForm', 'CheckoutForm'
  ],
  
  // Side effect free modules that can be tree shaken
  sideEffectFree: [
    'date-fns',
    'lodash',
    'ramda',
    'utility-libraries'
  ]
};

// Identify code that can be eliminated on initial load
export const codeElimination = {
  // Features not needed on homepage
  nonCriticalFeatures: [
    'charts',
    'analytics',
    'admin-panels', 
    'complex-forms',
    'payment-processing',
    'advanced-modals',
    'date-operations'
  ],
  
  // Libraries that can be loaded on demand
  onDemandLibraries: [
    '@stripe/stripe-js',
    'recharts',
    'react-hook-form',
    'date-fns',
    '@radix-ui/react-dialog',
    '@radix-ui/react-select'
  ]
};