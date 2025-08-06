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

// Mock data for demonstration - will be replaced with real data later
const generateMockData = (timeRange: number) => {
  // Mock agent data
  const mockAgent: Agent = {
    id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '(555) 123-4567',
    photo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah Johnson',
    brokerage: 'Keller Williams Realty',
    years_active: 8,
    social_facebook: 'https://facebook.com/sarahjohnsonrealtor',
    social_instagram: 'https://instagram.com/sarahjohnsonrealtor',
    social_linkedin: 'https://linkedin.com/in/sarahjohnsonrealtor',
    social_zillow: 'https://zillow.com/profile/sarahjohnson',
  };

  // Generate mock transactions
  const mockTransactions: Transaction[] = [];
  const propertyTypes: Array<'SFH' | 'TH' | 'Condo' | 'Commercial'> = ['SFH', 'TH', 'Condo', 'Commercial'];
  const loanTypes: Array<'Conventional' | 'FHA' | 'VA' | 'Other' | 'Cash'> = ['Conventional', 'FHA', 'VA', 'Other', 'Cash'];
  const sides: Array<'buyer' | 'seller'> = ['buyer', 'seller'];

  for (let i = 0; i < 45; i++) {
    const closeDate = new Date();
    closeDate.setMonth(closeDate.getMonth() - Math.random() * timeRange);
    
    mockTransactions.push({
      id: `transaction-${i}`,
      property_address: `${Math.floor(Math.random() * 9999)} ${['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Ln'][Math.floor(Math.random() * 5)]}`,
      city: ['Franklin', 'Nashville', 'Brentwood', 'Cool Springs', 'Murfreesboro'][Math.floor(Math.random() * 5)],
      state: 'TN',
      zip_code: `${37000 + Math.floor(Math.random() * 999)}`,
      latitude: 35.9250 + (Math.random() - 0.5) * 0.5,
      longitude: -86.8689 + (Math.random() - 0.5) * 0.5,
      close_date: closeDate.toISOString().split('T')[0],
      price: Math.floor(Math.random() * 800000) + 200000,
      side: sides[Math.floor(Math.random() * sides.length)],
      property_type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      loan_type: loanTypes[Math.floor(Math.random() * loanTypes.length)],
      lender_name: ['First Heritage Mortgage', 'CMG Mortgage', 'Wells Fargo', 'Rocket Mortgage', 'SunTrust Bank'][Math.floor(Math.random() * 5)],
      title_company_name: ['Universal Title', 'Champion Title', 'First American', 'Stewart Title', 'Old Republic'][Math.floor(Math.random() * 5)],
    });
  }

  return { mockAgent, mockTransactions };
};

export const useAgentData = (timeRange: number = 12) => {
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use mock data for now
    setTimeout(() => {
      const { mockAgent, mockTransactions } = generateMockData(timeRange);
      setAgent(mockAgent);
      setTransactions(mockTransactions);
      calculateStats(mockTransactions);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // This will be used when real data is available
      if (!user) {
        const { mockAgent, mockTransactions } = generateMockData(timeRange);
        setAgent(mockAgent);
        setTransactions(mockTransactions);
        calculateStats(mockTransactions);
        setLoading(false);
        return;
      }

      // This would be the real implementation when data is available
      const { mockAgent, mockTransactions } = generateMockData(timeRange);
      setAgent(mockAgent);
      setTransactions(mockTransactions);
      calculateStats(mockTransactions);
      setLoading(false);
      return;

      // Real data implementation would be here
      // For now, we'll continue using mock data

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