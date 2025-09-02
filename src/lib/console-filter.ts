import { devError, devWarn } from '@/lib/dev-logger';

// Override console methods to filter extension noise
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.error = (...args: any[]) => {
    devError(...args);
  };

  console.warn = (...args: any[]) => {
    devWarn(...args);
  };

  console.log = (...args: any[]) => {
    // Don't filter regular logs, but could be extended
    originalLog(...args);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason);
    
    // Filter extension-related promise rejections
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://', 
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id'
    ].some(pattern => message.includes(pattern));

    if (!isExtensionError) {
      devError('Unhandled promise rejection:', reason);
    }

    // Prevent the default browser console.error behavior for extension errors
    if (isExtensionError) {
      event.preventDefault();
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const filename = event.filename || '';
    
    // Filter extension-related errors
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id'
    ].some(pattern => 
      message.includes(pattern) || filename.includes(pattern)
    );

    if (!isExtensionError) {
      devError('Global error:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
      });
    }

    // Prevent the default browser console.error behavior for extension errors
    if (isExtensionError) {
      event.preventDefault();
    }
  });
}