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
    
    // Filter out extension noise AND Firebase errors from extensions
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://', 
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id',
      'web-client-content-script.js',
      'MutationObserver',
      'Failed to execute \'observe\' on \'MutationObserver\'',
      'parameter 1 is not of type \'Node\'',
      'content-script',
      'HTMLIFrameElement.<anonymous>',
      // Firebase/Firestore errors from browser extensions
      'firestore.googleapis.com',
      'firebase',
      'firestore',
      'gpt-engineer',
      'projects%2Fgpt-engineer',
      '@firebase/firestore',
      'WebChannelConnection RPC',
      // Analytics/tracking errors
      'lovable.dev/ingest',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_ABORTED',
      // Sentry errors
      'sentry.io',
      'ingest.sentry.io',
      // Cross-origin and permissions policy warnings
      'Potential permissions policy violation',
      'cross-origin-isolated is not allowed',
      // Cloudflare Turnstile preload warnings
      'challenges.cloudflare.com',
      'was preloaded using link preload but not used',
      'challenge-platform'
    ].some(pattern => message.includes(pattern));

    if (!isExtensionError) {
      originalConsole.error(...args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = String(args[0] ?? '');
    
    // Filter out extension noise AND Firebase errors from extensions
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id',
      'web-client-content-script.js',
      'MutationObserver',
      'Failed to execute \'observe\' on \'MutationObserver\'',
      'parameter 1 is not of type \'Node\'',
      'content-script',
      'HTMLIFrameElement.<anonymous>',
      // Firebase/Firestore errors from browser extensions
      'firestore.googleapis.com',
      'firebase',
      'firestore',
      'gpt-engineer',
      'projects%2Fgpt-engineer',
      '@firebase/firestore',
      'WebChannelConnection RPC',
      // Analytics/tracking errors
      'lovable.dev/ingest',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_ABORTED',
      // Sentry errors
      'sentry.io',
      'ingest.sentry.io',
      // Cross-origin and permissions policy warnings
      'Potential permissions policy violation',
      'cross-origin-isolated is not allowed',
      // Cloudflare Turnstile preload warnings
      'challenges.cloudflare.com',
      'was preloaded using link preload but not used',
      'challenge-platform'
    ].some(pattern => message.includes(pattern));

    if (!isExtensionError) {
      originalConsole.warn(...args);
    }
  };

  console.log = (...args: any[]) => {
    const message = String(args[0] ?? '');
    // Filter out extension and external script noise from console.log too
    const isFilteredMessage = [
      'web-client-content-script.js',
      'MutationObserver',
      'Failed to execute \'observe\' on \'MutationObserver\'',
      'parameter 1 is not of type \'Node\'',
      'HTMLIFrameElement.<anonymous>',
      'content-script'
    ].some(pattern => message.includes(pattern));
    
    if (!isFilteredMessage) {
      originalConsole.log(...args);
    }
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason);
    
    // Filter extension-related promise rejections AND Firebase errors
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://', 
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id',
      'web-client-content-script.js',
      'MutationObserver',
      'Failed to execute \'observe\' on \'MutationObserver\'',
      'parameter 1 is not of type \'Node\'',
      'content-script',
      'HTMLIFrameElement.<anonymous>',
      // Firebase/Firestore errors from browser extensions
      'firestore.googleapis.com',
      'firebase',
      'firestore',
      'gpt-engineer',
      'projects%2Fgpt-engineer',
      '@firebase/firestore',
      'WebChannelConnection RPC',
      // Analytics/tracking errors
      'lovable.dev/ingest',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_ABORTED',
      // Sentry errors
      'sentry.io',
      'ingest.sentry.io',
      // Cross-origin and permissions policy warnings
      'Potential permissions policy violation',
      'cross-origin-isolated is not allowed',
      // Cloudflare Turnstile preload warnings
      'challenges.cloudflare.com',
      'was preloaded using link preload but not used',
      'challenge-platform'
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
    
    // Filter extension-related errors AND Firebase errors
    const isExtensionError = [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'ms-browser-extension://',
      'Invalid frameId',
      'Extension context invalidated',
      'background-redux-new.js',
      'LastPass',
      'duplicate id',
      'web-client-content-script.js',
      'MutationObserver',
      'Failed to execute \'observe\' on \'MutationObserver\'',
      'parameter 1 is not of type \'Node\'',
      'content-script',
      'HTMLIFrameElement.<anonymous>',
      // Firebase/Firestore errors from browser extensions
      'firestore.googleapis.com',
      'firebase',
      'firestore',
      'gpt-engineer',
      'projects%2Fgpt-engineer',
      '@firebase/firestore',
      'WebChannelConnection RPC',
      // Analytics/tracking errors
      'lovable.dev/ingest',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_ABORTED',
      // Sentry errors
      'sentry.io',
      'ingest.sentry.io',
      // Cross-origin and permissions policy warnings
      'Potential permissions policy violation',
      'cross-origin-isolated is not allowed',
      // Cloudflare Turnstile preload warnings
      'challenges.cloudflare.com',
      'was preloaded using link preload but not used',
      'challenge-platform'
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