import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Transaction {
  id: string;
  property_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  close_date: string;
  price: number;
  side: 'buyer' | 'seller';
  property_type?: 'SFH' | 'TH' | 'Condo' | 'Commercial';
  loan_type?: 'Conventional' | 'FHA' | 'VA' | 'Other' | 'Cash';
  lender_name?: string;
  title_company_name?: string;
  source: 'feed' | 'self_report';
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
  data_feed_active: boolean;
  data_feed_last_sync?: string;
  feed_provider?: string;
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
  hasDataFeed: boolean;
  needsQuiz: boolean;
}

export const useAgentData = (timeRange: number = 12) => {
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAgentData();
    } else {
      setLoading(false);
    }
  }, [user, timeRange]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setAgent(null);
        setTransactions([]);
        setStats(null);
        setLoading(false);
        return;
      }

      // Helper to add timeout to Supabase calls
      const withTimeout = async <T,>(promise: Promise<T>, ms = 5000): Promise<T> => {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), ms)
        );
        return Promise.race([promise, timeoutPromise]);
      };

      // 1. Get agent profile with timeout
      const { data: agentData, error: agentError } = await withTimeout(
        supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        5000
      );

      if (agentError && agentError.code !== 'PGRST116') {
        throw agentError;
      }

      if (!agentData) {
        // No agent profile found - user is not an agent
        setAgent(null);
        setTransactions([]);
        setStats(null);
        setLoading(false);
        return;
      }

      setAgent(agentData);

      // 2. Get transactions from data feed with timeout
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - timeRange);

      const { data: transactionData, error: transactionError } = await withTimeout(
        supabase
          .from('agent_transactions')
          .select('*')
          .eq('agent_id', agentData.id)
          .gte('close_date', cutoffDate.toISOString().split('T')[0])
          .order('close_date', { ascending: false }),
        5000
      );

      if (transactionError) {
        console.warn('Transaction fetch failed:', transactionError);
      }

      // Convert to our Transaction format
      const formattedTransactions: Transaction[] = (transactionData || []).map(t => ({
        id: t.id,
        property_address: `${t.property_city || 'Unknown'}, ${t.property_state || 'Unknown'}`,
        city: t.property_city,
        state: t.property_state,
        close_date: t.close_date,
        price: Number(t.sale_price),
        side: t.role as 'buyer' | 'seller',
        lender_name: t.lender,
        title_company_name: t.title_company,
        source: t.source as 'feed' | 'self_report'
      }));

      // 3. If no transactions from feed, check for quiz responses
      let finalTransactions = formattedTransactions;
      let hasDataFeed = agentData.data_feed_active && formattedTransactions.length > 0;
      let needsQuiz = false;

      if (!hasDataFeed) {
        // Check for existing quiz response with timeout
        try {
          const { data: quizData } = await withTimeout(
            supabase
              .from('agent_quiz_responses')
              .select('*')
              .eq('agent_id', agentData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single(),
            3000
          );

          if (quizData) {
            // Generate transactions from quiz data for stats calculation
            const buyerTransactions: Transaction[] = Array.from({ length: quizData.buyers_count }, (_, i) => ({
              id: `quiz-buyer-${i}`,
              close_date: new Date(Date.now() - Math.random() * timeRange * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              price: Number(quizData.avg_price),
              side: 'buyer' as const,
              source: 'self_report' as const
            }));

            const sellerTransactions: Transaction[] = Array.from({ length: quizData.sellers_count }, (_, i) => ({
              id: `quiz-seller-${i}`,
              close_date: new Date(Date.now() - Math.random() * timeRange * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              price: Number(quizData.avg_price),
              side: 'seller' as const,
              source: 'self_report' as const
            }));

            finalTransactions = [...buyerTransactions, ...sellerTransactions];
            hasDataFeed = false;
          } else {
            needsQuiz = true;
          }
        } catch (quizError) {
          console.warn('Quiz data fetch failed:', quizError);
          needsQuiz = true;
        }
      }

      setTransactions(finalTransactions);
      calculateStats(finalTransactions, hasDataFeed, needsQuiz);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching agent data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const calculateStats = (transactions: Transaction[], hasDataFeed: boolean, needsQuiz: boolean) => {
    const buyerTransactions = transactions.filter(t => t.side === 'buyer');
    const sellerTransactions = transactions.filter(t => t.side === 'seller');

    const avgBuyerPrice = buyerTransactions.length > 0 
      ? buyerTransactions.reduce((sum, t) => sum + t.price, 0) / buyerTransactions.length 
      : 0;

    const avgSellerPrice = sellerTransactions.length > 0 
      ? sellerTransactions.reduce((sum, t) => sum + t.price, 0) / sellerTransactions.length 
      : 0;

    const totalVolume = transactions.reduce((sum, t) => sum + t.price, 0);

    // Calculate loan types (only available with data feed)
    const loanTypes: Record<string, number> = {};
    if (hasDataFeed) {
      transactions.forEach(t => {
        if (t.loan_type) {
          loanTypes[t.loan_type] = (loanTypes[t.loan_type] || 0) + 1;
        }
      });
    }

    // Calculate lender statistics (only available with data feed)
    const lenderCounts: Record<string, number> = {};
    if (hasDataFeed) {
      transactions.forEach(t => {
        if (t.lender_name) {
          lenderCounts[t.lender_name] = (lenderCounts[t.lender_name] || 0) + 1;
        }
      });
    }

    const lenders = Object.entries(lenderCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / transactions.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate title company statistics (only available with data feed)
    const titleCounts: Record<string, number> = {};
    if (hasDataFeed) {
      transactions.forEach(t => {
        if (t.title_company_name) {
          titleCounts[t.title_company_name] = (titleCounts[t.title_company_name] || 0) + 1;
        }
      });
    }

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
      titleCompanies,
      hasDataFeed,
      needsQuiz
    });
  };

  const submitQuizResponse = async (buyers: number, sellers: number, avgPrice: number) => {
    if (!agent) return;

    try {
      const { error } = await supabase
        .from('agent_quiz_responses')
        .insert({
          agent_id: agent.id,
          buyers_count: buyers,
          sellers_count: sellers,
          avg_price: avgPrice,
          period_months: timeRange
        });

      if (error) throw error;

      // Refresh data after quiz submission
      await fetchAgentData();
    } catch (err) {
      console.error('Error submitting quiz response:', err);
      throw err;
    }
  };

  return {
    agent,
    transactions,
    stats,
    loading,
    error,
    refetch: fetchAgentData,
    submitQuizResponse
  };
};