import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface PriceRange {
  min: number;
  max: number;
  isLoading: boolean;
}

export const useServicePriceRange = (): PriceRange => {
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: 0,
    max: 5000, // Default fallback
    isLoading: true
  });

  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        logger.log('🔍 Fetching service price range from database...');
        
        // Query to get min and max prices from all price fields
        const { data, error } = await supabase
          .from('services')
          .select('retail_price, pro_price, co_pay_price')
          .not('retail_price', 'is', null);

        if (error) {
          logger.log('❌ Error fetching price range:', error);
          return;
        }

        if (!data || data.length === 0) {
          logger.log('⚠️ No services found for price range calculation');
          return;
        }

        // Extract all prices and find min/max
        const allPrices: number[] = [];
        
        data.forEach(service => {
          // Extract numeric values from price strings
          const extractPrice = (priceStr: string | null): number | null => {
            if (!priceStr) return null;
            const match = priceStr.match(/[\d,]+(\.\d{2})?/);
            if (match) {
              return parseFloat(match[0].replace(/,/g, ''));
            }
            return null;
          };

          const retailPrice = extractPrice(service.retail_price);
          const proPrice = extractPrice(service.pro_price);
          const coPayPrice = extractPrice(service.co_pay_price);

          if (retailPrice !== null) allPrices.push(retailPrice);
          if (proPrice !== null) allPrices.push(proPrice);
          if (coPayPrice !== null) allPrices.push(coPayPrice);
        });

        if (allPrices.length === 0) {
          logger.log('⚠️ No valid prices found in services');
          setPriceRange(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        
        // Add 10% buffer to max price for better UX
        const bufferedMax = Math.ceil(maxPrice * 1.1);
        
        logger.log(`✅ Price range calculated: $${minPrice} - $${maxPrice} (buffered to $${bufferedMax})`);
        
        setPriceRange({
          min: Math.floor(minPrice),
          max: bufferedMax,
          isLoading: false
        });

      } catch (error) {
        logger.log('❌ Unexpected error fetching price range:', error);
        setPriceRange(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchPriceRange();
  }, []);

  return priceRange;
};