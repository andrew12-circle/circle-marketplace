import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  id: string;
  property_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  close_date: string;
  price: number;
  side: 'buyer' | 'seller';
  property_type: 'SFH' | 'TH' | 'Condo' | 'Commercial';
  loan_type?: 'Conventional' | 'FHA' | 'VA' | 'Other' | 'Cash';
  lender_name?: string;
  title_company_name?: string;
}

export interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  brokerage?: string;
  years_active?: number;
  social_facebook?: string;
  social_instagram?: string;
  social_linkedin?: string;
  social_youtube?: string;
  social_zillow?: string;
}

export interface AgentStats {
  buyerDeals: number;
  sellerDeals: number;
  avgBuyerPrice: number;
  avgSellerPrice: number;
  totalVolume: number;
  loanTypes: Record<string, number>;
  lenders: Array<{ name: string; count: number; percentage: number }>;
  titleCompanies: Array<{ name: string; count: number; percentage: number }>;
}

export const useAgentData = (timeRange: number = 12) => {
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    fetchAgentData();
  }, [user, timeRange]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get agent profile
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (agentError && agentError.code !== 'PGRST116') {
        throw agentError;
      }

      setAgent(agentData);

      if (!agentData) {
        setLoading(false);
        return;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - timeRange);

      // Get transactions with related data
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          lenders(name),
          title_companies(name)
        `)
        .eq('agent_id', agentData.id)
        .gte('close_date', startDate.toISOString().split('T')[0])
        .lte('close_date', endDate.toISOString().split('T')[0])
        .order('close_date', { ascending: false });

      if (transactionError) {
        throw transactionError;
      }

      // Transform transaction data
      const transformedTransactions: Transaction[] = (transactionData || []).map(t => ({
        id: t.id,
        property_address: t.property_address,
        city: t.city,
        state: t.state,
        zip_code: t.zip_code,
        latitude: t.latitude,
        longitude: t.longitude,
        close_date: t.close_date,
        price: t.price,
        side: t.side as 'buyer' | 'seller',
        property_type: t.property_type as 'SFH' | 'TH' | 'Condo' | 'Commercial',
        loan_type: t.loan_type as 'Conventional' | 'FHA' | 'VA' | 'Other' | 'Cash' | undefined,
        lender_name: t.lenders?.name,
        title_company_name: t.title_companies?.name,
      }));

      setTransactions(transformedTransactions);

      // Calculate statistics
      calculateStats(transformedTransactions);

    } catch (err) {
      console.error('Error fetching agent data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactions: Transaction[]) => {
    const buyerTransactions = transactions.filter(t => t.side === 'buyer');
    const sellerTransactions = transactions.filter(t => t.side === 'seller');

    const avgBuyerPrice = buyerTransactions.length > 0 
      ? buyerTransactions.reduce((sum, t) => sum + t.price, 0) / buyerTransactions.length 
      : 0;

    const avgSellerPrice = sellerTransactions.length > 0 
      ? sellerTransactions.reduce((sum, t) => sum + t.price, 0) / sellerTransactions.length 
      : 0;

    const totalVolume = transactions.reduce((sum, t) => sum + t.price, 0);

    // Calculate loan types
    const loanTypes: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.loan_type) {
        loanTypes[t.loan_type] = (loanTypes[t.loan_type] || 0) + 1;
      }
    });

    // Calculate lender statistics
    const lenderCounts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.lender_name) {
        lenderCounts[t.lender_name] = (lenderCounts[t.lender_name] || 0) + 1;
      }
    });

    const lenders = Object.entries(lenderCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / transactions.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate title company statistics
    const titleCounts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.title_company_name) {
        titleCounts[t.title_company_name] = (titleCounts[t.title_company_name] || 0) + 1;
      }
    });

    const titleCompanies = Object.entries(titleCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / transactions.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    setStats({
      buyerDeals: buyerTransactions.length,
      sellerDeals: sellerTransactions.length,
      avgBuyerPrice,
      avgSellerPrice,
      totalVolume,
      loanTypes,
      lenders,
      titleCompanies
    });
  };

  return {
    agent,
    transactions,
    stats,
    loading,
    error,
    refetch: fetchAgentData
  };
};