import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { supabase } from '@/integrations/supabase/client';
import faqData from '@/config/faq.json';

export interface AgentFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  last_updated: string;
  keywords?: string[];
  cta_text?: string;
  cta_href?: string;
}

export interface AgentFaqSection {
  title: string;
  items: AgentFaqItem[];
}

// Transform FAQ items into sections grouped by category
function groupFaqsByCategory(items: AgentFaqItem[]): AgentFaqSection[] {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, AgentFaqItem[]>);

  return Object.entries(grouped).map(([category, items]) => ({
    title: category,
    items: items.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
  }));
}

// Fetch FAQ items from Supabase or fallback to JSON
export async function getFaqItems(): Promise<AgentFaqSection[]> {
  try {
    // Check if Supabase FAQ feature is enabled
    const isSupabaseEnabled = window.location.search.includes('ff_faq_supabase=on') || 
                              localStorage.getItem('featureFlags')?.includes('faq_supabase');

    if (isSupabaseEnabled) {
      const { data, error } = await supabase
        .from('faq_items')
        .select('id, question, answer, category, tags, last_updated, keywords, cta_text, cta_href')
        .order('category', { ascending: true })
        .order('last_updated', { ascending: false });

      if (!error && data && data.length > 0) {
        return groupFaqsByCategory(data as AgentFaqItem[]);
      }
    }
  } catch (error) {
    console.warn('Failed to fetch FAQs from Supabase, falling back to JSON:', error);
  }

  // Fallback to local JSON data
  return groupFaqsByCategory(faqData as AgentFaqItem[]);
}

// Hook for React components
export function useFaqItems() {
  const [faqSections, setFaqSections] = React.useState<AgentFaqSection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getFaqItems()
      .then(setFaqSections)
      .catch((error) => {
        console.error('Error loading FAQ items:', error);
        // Fallback to empty array on error
        setFaqSections([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { faqSections, loading };
}