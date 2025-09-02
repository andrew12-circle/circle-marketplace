// Store original console methods before any imports
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log
};

// Override console methods to filter extension noise
if (typeof window !== 'undefined') {
  // Make original methods available globally for dev-logger
  (window as any).__originalConsole = originalConsole;

  console.error = (...args: any[]) => {
    const message = String(args[0] ?? '');
    
    // Filter out extension noise
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
      originalConsole.error(...args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = String(args[0] ?? '');
    
    // Filter out extension noise
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
      originalConsole.warn(...args);
    }
  };

  console.log = (...args: any[]) => {
    // Don't filter regular logs, but could be extended
    originalConsole.log(...args);
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
      originalConsole.error('Unhandled promise rejection:', reason);
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
      originalConsole.error('Global error:', {
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