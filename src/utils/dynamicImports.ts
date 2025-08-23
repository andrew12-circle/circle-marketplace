// Dynamic imports for vendor libraries to reduce initial bundle size
export const loadChartLibrary = () => 
  import('recharts').then(module => module);

export const loadSupabaseClient = () =>
  import('@supabase/supabase-js').then(module => module);

export const loadFormLibraries = () =>
  Promise.all([
    import('react-hook-form'),
    import('@hookform/resolvers/zod'),
    import('zod')
  ]);

export const loadDateLibraries = () =>
  Promise.all([
    import('date-fns'),
    import('react-day-picker')
  ]);

export const loadPaymentLibraries = () =>
  import('@stripe/stripe-js').then(module => module);

export const loadI18nLibraries = () =>
  Promise.all([
    import('i18next'),
    import('react-i18next')
  ]);

export const loadRadixComponents = (components: string[]) => {
  const imports = components.map(component => {
    switch (component) {
      case 'dialog':
        return import('@radix-ui/react-dialog');
      case 'dropdown':
        return import('@radix-ui/react-dropdown-menu');
      case 'select':
        return import('@radix-ui/react-select');
      case 'toast':
        return import('@radix-ui/react-toast');
      case 'popover':
        return import('@radix-ui/react-popover');
      default:
        return Promise.resolve(null);
    }
  });
  
  return Promise.allSettled(imports);
};