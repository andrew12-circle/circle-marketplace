export const DEBUG = false; // flip when needed

export function dlog(...args: any[]) { 
  if (DEBUG) console.log(...args); 
}

export function dwarn(...args: any[]) { 
  if (DEBUG) console.warn(...args); 
}

export function dinfo(...args: any[]) { 
  if (DEBUG) console.info(...args); 
}