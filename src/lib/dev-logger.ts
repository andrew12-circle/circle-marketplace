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
  'ms-browser-extension://'
];

export function devLog(...args: any[]) {
  const message = String(args[0] ?? '');
  
  // Filter out extension noise
  if (NOISY_PATTERNS.some(pattern => message.includes(pattern))) {
    return;
  }
  
  // eslint-disable-next-line no-console
  console.log(...args);
}

export function devWarn(...args: any[]) {
  const message = String(args[0] ?? '');
  
  // Filter out extension noise
  if (NOISY_PATTERNS.some(pattern => message.includes(pattern))) {
    return;
  }
  
  // eslint-disable-next-line no-console
  console.warn(...args);
}

export function devError(...args: any[]) {
  const message = String(args[0] ?? '');
  
  // Filter out extension noise  
  if (NOISY_PATTERNS.some(pattern => message.includes(pattern))) {
    return;
  }
  
  // eslint-disable-next-line no-console
  console.error(...args);
}