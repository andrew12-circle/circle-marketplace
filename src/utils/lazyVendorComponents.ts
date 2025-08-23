import { lazy } from 'react';

// Lazy load heavy third-party components only when needed
export const LazyRecharts = lazy(() => 
  import('recharts').then(module => ({
    default: module.ResponsiveContainer || (() => null)
  })).catch(() => ({ default: () => null }))
);

export const LazyReactHookForm = lazy(() =>
  import('react-hook-form').then(module => ({
    default: module.useForm || (() => null)
  })).catch(() => ({ default: () => null }))
);

export const LazyDateFns = lazy(() =>
  import('date-fns').then(module => ({
    default: module.format || (() => null)
  })).catch(() => ({ default: () => null }))
);

export const LazyRadixDialog = lazy(() =>
  import('@radix-ui/react-dialog').then(module => ({
    default: module.Dialog || (() => null)
  })).catch(() => ({ default: () => null }))
);

export const LazyRadixSelect = lazy(() =>
  import('@radix-ui/react-select').then(module => ({
    default: module.Select || (() => null)
  })).catch(() => ({ default: () => null }))
);

// Stripe is not a React component, so we don't lazy load it the same way
export const loadStripeAsync = () =>
  import('@stripe/stripe-js').then(module => module.loadStripe);