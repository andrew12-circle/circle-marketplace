// FILE: src/components/security/HoneypotField.tsx

import React from 'react';
import { actionTokens } from '@/lib/anti-bot/action-tokens';

interface HoneypotFieldProps {
  onValueChange?: (value: string) => void;
}

export function HoneypotField({ onValueChange }: HoneypotFieldProps) {
  const honeypot = actionTokens.generateHoneypot();

  return (
    <input
      type="text"
      name={honeypot.name}
      style={honeypot.style}
      tabIndex={honeypot.tabIndex}
      autoComplete="off"
      onChange={(e) => onValueChange?.(e.target.value)}
      aria-hidden="true"
    />
  );
}