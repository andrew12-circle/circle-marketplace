import React, { useEffect } from 'react';
import { useSpiritualCoverage } from '@/contexts/SpiritualCoverageContext';

interface SpiritualCoPayProps {
  children: React.ReactNode;
  requestId?: string;
  amount?: number;
  agentId?: string;
  vendorId?: string;
}

export const SpiritualCoPay: React.FC<SpiritualCoPayProps> = ({ 
  children, 
  requestId, 
  amount, 
  agentId, 
  vendorId 
}) => {
  const { applyGuard } = useSpiritualCoverage();

  useEffect(() => {
    const applyCoverageAsync = async () => {
      await applyGuard('CO_PAY_REQUEST', {
        requestId,
        amount,
        agentId,
        vendorId,
        timestamp: new Date().toISOString(),
        protection_type: 'financial_partnership'
      });
    };

    applyCoverageAsync();
  }, [applyGuard, requestId, amount, agentId, vendorId]);

  return <>{children}</>;
};