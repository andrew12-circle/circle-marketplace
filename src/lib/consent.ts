export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: string;
}

export interface ConsentPreferences extends CookieConsent {
  version: string;
}

const CONSENT_STORAGE_KEY = 'circle_cookie_consent';
const CONSENT_VERSION = '1.0';

export const getConsentPreferences = (): ConsentPreferences | null => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    
    const preferences = JSON.parse(stored) as ConsentPreferences;
    
    // Check if consent is still valid (version matches)
    if (preferences.version !== CONSENT_VERSION) {
      return null;
    }
    
    return preferences;
  } catch (error) {
    console.error('Error reading consent preferences:', error);
    return null;
  }
};

export const setConsentPreferences = (consent: CookieConsent): void => {
  try {
    const preferences: ConsentPreferences = {
      ...consent,
      version: CONSENT_VERSION,
    };
    
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: preferences 
    }));
    
    // Log consent decision for compliance
    console.log('Cookie consent updated:', preferences);
  } catch (error) {
    console.error('Error saving consent preferences:', error);
  }
};

export const hasGivenConsent = (): boolean => {
  const preferences = getConsentPreferences();
  return preferences !== null;
};

export const hasAnalyticsConsent = (): boolean => {
  const preferences = getConsentPreferences();
  return preferences?.analytics === true;
};

export const hasFunctionalConsent = (): boolean => {
  const preferences = getConsentPreferences();
  return preferences?.functional === true;
};

export const hasMarketingConsent = (): boolean => {
  const preferences = getConsentPreferences();
  return preferences?.marketing === true;
};

export const respectsDoNotTrack = (): boolean => {
  return navigator.doNotTrack === '1' || 
         navigator.doNotTrack === 'yes' || 
         (window as any).doNotTrack === '1';
};

export const clearConsentPreferences = (): void => {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: null 
    }));
  } catch (error) {
    console.error('Error clearing consent preferences:', error);
  }
};

export const getDefaultConsent = (): CookieConsent => ({
  necessary: true, // Always true - required for basic functionality
  analytics: false,
  functional: false,
  marketing: false,
  timestamp: new Date().toISOString(),
});

export const acceptAllConsent = (): CookieConsent => ({
  necessary: true,
  analytics: true,
  functional: true,
  marketing: true,
  timestamp: new Date().toISOString(),
});