import { useTranslation } from 'react-i18next';
import { useLocation } from './useLocation';

export const useCurrency = () => {
  const { i18n } = useTranslation();
  const { location } = useLocation();

  // Determine currency based on location (Canada = CAD, others = USD)
  const getCurrency = () => {
    // Canadian provinces and territories
    const canadianProvinces = [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 
      'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 
      'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
      'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
    ];
    
    if (location?.state && canadianProvinces.some(province => 
      province.toLowerCase() === location.state?.toLowerCase()
    )) {
      return 'CAD';
    }
    return 'USD';
  };

  const currency = getCurrency();

  // Format price with appropriate currency
  const formatPrice = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return `${currency} 0`;

    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currency === 'CAD' ? 'C$' : '$';
  };

  return {
    currency,
    formatPrice,
    getCurrencySymbol
  };
};