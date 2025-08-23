import { lazy } from 'react';

// Lazy load heavy modal components to reduce initial bundle size
export const LazyServiceDetailsModal = lazy(() => 
  import('../components/marketplace/ServiceDetailsModal').then(module => ({
    default: module.ServiceDetailsModal
  }))
);

export const LazyVendorSelectionModal = lazy(() =>
  import('../components/marketplace/VendorSelectionModal').then(module => ({
    default: module.VendorSelectionModal
  }))
);

export const LazyServiceBundles = lazy(() =>
  import('../components/marketplace/ServiceBundles').then(module => ({
    default: module.ServiceBundles
  }))
);

export const LazyAddProductModal = lazy(() =>
  import('../components/marketplace/AddProductModal').then(module => ({
    default: module.AddProductModal
  }))
);