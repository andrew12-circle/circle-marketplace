import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityMonitoring } from '@/components/security/SecurityEnhancementSystem';

interface CSRFContextType {
  token: string | null;
  refreshToken: () => Promise<void>;
}

const CSRFContext = createContext<CSRFContextType>({
  token: null,
  refreshToken: async () => {}
});

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
};

export const CSRFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const { logSecurityEvent } = useSecurityMonitoring();

  const generateToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const refreshToken = async () => {
    const newToken = generateToken();
    setToken(newToken);
    
    // Store token in session storage for validation
    sessionStorage.setItem('csrf_token', newToken);
    
    // Log CSRF token generation using enhanced security system
    await logSecurityEvent('csrf_token_generated', {
      token_length: newToken.length,
      generation_method: 'crypto.getRandomValues'
    });
  };

  useEffect(() => {
    refreshToken();
    
    // Refresh token periodically for security
    const interval = setInterval(refreshToken, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, []);

  return (
    <CSRFContext.Provider value={{ token, refreshToken }}>
      {children}
    </CSRFContext.Provider>
  );
};

// CSRF Token component for forms
export const CSRFToken: React.FC = () => {
  const { token } = useCSRF();
  
  if (!token) return null;
  
  return (
    <input
      type="hidden"
      name="csrf_token"
      value={token}
      readOnly
    />
  );
};

// Utility function to validate CSRF token
export const validateCSRFToken = (submittedToken: string): boolean => {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === submittedToken && storedToken !== null;
};