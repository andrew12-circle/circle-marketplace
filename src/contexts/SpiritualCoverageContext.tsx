import { createContext, useContext, useCallback, ReactNode } from 'react';
import { applyPrayerGuard, SPIRITUAL_COVERAGE, getDailyScripture } from '@/lib/prayerGuard';

interface SpiritualCoverageContextType {
  applyGuard: (event: keyof typeof SPIRITUAL_COVERAGE, meta?: Record<string, any>) => Promise<void>;
  getDailyBlessing: () => Promise<any>;
  coverOperation: (operationName: string, operation: () => Promise<any>, meta?: Record<string, any>) => Promise<any>;
}

const SpiritualCoverageContext = createContext<SpiritualCoverageContextType | undefined>(undefined);

export function SpiritualCoverageProvider({ children }: { children: ReactNode }) {
  const applyGuard = useCallback(async (event: keyof typeof SPIRITUAL_COVERAGE, meta: Record<string, any> = {}) => {
    try {
      await applyPrayerGuard(SPIRITUAL_COVERAGE[event], meta);
    } catch (error) {
      console.error('Spiritual coverage error:', error);
    }
  }, []);

  const getDailyBlessing = useCallback(async () => {
    try {
      return await getDailyScripture(['blessing', 'protection']);
    } catch (error) {
      console.error('Daily blessing error:', error);
      return null;
    }
  }, []);

  const coverOperation = useCallback(async (
    operationName: string, 
    operation: () => Promise<any>, 
    meta: Record<string, any> = {}
  ) => {
    try {
      // Apply spiritual covering before operation
      await applyPrayerGuard(operationName, { ...meta, stage: 'before' });
      
      // Execute the operation
      const result = await operation();
      
      // Apply blessing after successful operation
      await applyPrayerGuard(operationName, { ...meta, stage: 'after', success: true });
      
      return result;
    } catch (error) {
      // Apply prayer for protection in case of error
      await applyPrayerGuard(operationName, { 
        ...meta, 
        stage: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, []);

  return (
    <SpiritualCoverageContext.Provider value={{ applyGuard, getDailyBlessing, coverOperation }}>
      {children}
    </SpiritualCoverageContext.Provider>
  );
}

export function useSpiritualCoverage() {
  const context = useContext(SpiritualCoverageContext);
  if (context === undefined) {
    throw new Error('useSpiritualCoverage must be used within a SpiritualCoverageProvider');
  }
  return context;
}