// Filter out noisy extension errors in development
const NOISY_PATTERNS = [
  'background-redux-new.js',
  'chrome-extension://',
  'LastPass',
  'web-client-content-script.js',
  'Invalid frameId',
  'duplicate id',
  'Extension context invalidated',
  'moz-extension://',
  'safari-extension://',
  'ms-browser-extension://',
  'Cannot find menu item with id LastPass',
  'Cannot find menu item with id Add Item',
  'Unchecked runtime.lastError',
  'stripe.com',
  'm-outer-'
];

export function devLog(...args: any[]) {
  const message = String(args[0] ?? '');
  
  // Filter out extension noise
  if (NOISY_PATTERNS.some(pattern => message.includes(pattern))) {
    return;
  }
  
  // Use original console if available, otherwise fallback
  const originalConsole = (window as any).__originalConsole;
  if (originalConsole) {
    originalConsole.log(...args);
  } else {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function devWarn(...args: any[]) {
  const message = String(args[0] ?? '');
  
  // Filter out extension noise
  if (NOISY_PATTERNS.some(pattern => message.includes(pattern))) {
    return;
  }
  
  // Use original console if available, otherwise fallback
  const originalConsole = (window as any).__originalConsole;
  if (originalConsole) {
    originalConsole.warn(...args);
  } else {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}

export function devError(...args: any[]) {
  const message = String(args[0] ?? '');
  
  // Filter out extension noise  
  if (NOISY_PATTERNS.some(pattern => message.includes(pattern))) {
    return;
  }
  
  // Use original console if available, otherwise fallback
  const originalConsole = (window as any).__originalConsole;
  if (originalConsole) {
    originalConsole.error(...args);
  } else {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}