// Feature safety utilities to prevent cross-feature conflicts

export interface FeatureFlags {
  marketplace: boolean;
  academy: boolean;
  adminPanel: boolean;
}

// Default feature flags - all enabled in production
const DEFAULT_FLAGS: FeatureFlags = {
  marketplace: true,
  academy: true,
  adminPanel: true,
};

// Get feature flags from localStorage or use defaults
export const getFeatureFlags = (): FeatureFlags => {
  try {
    const stored = localStorage.getItem('circle-feature-flags');
    if (stored) {
      return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Error reading feature flags:', error);
  }
  return DEFAULT_FLAGS;
};

// Set feature flags (useful for debugging)
export const setFeatureFlags = (flags: Partial<FeatureFlags>) => {
  try {
    const current = getFeatureFlags();
    const updated = { ...current, ...flags };
    localStorage.setItem('circle-feature-flags', JSON.stringify(updated));
    console.log('Feature flags updated:', updated);
  } catch (error) {
    console.error('Error setting feature flags:', error);
  }
};

// Safe data access - prevents one feature from corrupting another's data
export const safeDataAccess = {
  // Marketplace data keys
  marketplace: {
    vendors: 'marketplace:vendors',
    services: 'marketplace:services', 
    filters: 'marketplace:filters',
    cart: 'marketplace:cart',
  },
  
  // Academy data keys  
  academy: {
    courses: 'academy:courses',
    videos: 'academy:videos',
    progress: 'academy:progress',
    bookmarks: 'academy:bookmarks',
  },
  
  // Shared data keys
  shared: {
    user: 'shared:user',
    auth: 'shared:auth',
    location: 'shared:location',
  }
};

// Safe localStorage access with namespacing
export const safeStorage = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Development helpers
export const devTools = {
  // Disable a feature temporarily
  disableFeature: (feature: keyof FeatureFlags) => {
    setFeatureFlags({ [feature]: false });
    window.location.reload();
  },
  
  // Enable a feature
  enableFeature: (feature: keyof FeatureFlags) => {
    setFeatureFlags({ [feature]: true });
    window.location.reload();
  },
  
  // Reset all features to default
  resetFeatures: () => {
    localStorage.removeItem('circle-feature-flags');
    window.location.reload();
  },
  
  // Log current feature status
  checkFeatures: () => {
    console.log('Current feature flags:', getFeatureFlags());
  }
};

// Make dev tools available in development
if (process.env.NODE_ENV === 'development') {
  (window as any).circleDevTools = devTools;
  console.log('🛠️ Circle Dev Tools available at window.circleDevTools');
}