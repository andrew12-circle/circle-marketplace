import React from 'react';

interface SafeTextProps {
  value: any;
  className?: string;
}

export function SafeText({ value, className }: SafeTextProps) {
  if (value == null) return null;
  
  if (typeof value === 'object') {
    return <span className={className}>{JSON.stringify(value)}</span>;
  }
  
  return <span className={className}>{String(value)}</span>;
}