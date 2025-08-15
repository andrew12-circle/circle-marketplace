import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorQuestion {
  id: string;
  vendor_id: string;
  question_number: number;
  question_text: string;
  created_at: string;
  updated_at: string;
}

export const useVendorQuestions = (vendorId: string | undefined) => {
  const [questions, setQuestions] = useState<VendorQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    fetchQuestions();
  }, [vendorId]);

  const fetchQuestions = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching questions for vendor:', vendorId);

      const { data, error: fetchError } = await supabase
        .from('vendor_questions')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('question_number');

      if (fetchError) throw fetchError;

      console.log('Questions fetched:', data);

      // If no questions exist, seed default questions
      if (!data || data.length === 0) {
        console.log('No questions found, seeding default questions...');
        await seedDefaultQuestions();
        return;
      }

      setQuestions(data);
      console.log('Questions set in state:', data);
    } catch (err) {
      console.error('Error fetching vendor questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultQuestions = async () => {
    if (!vendorId) return;

    try {
      const { error: seedError } = await supabase.rpc('seed_vendor_questions', {
        p_vendor_id: vendorId
      });

      if (seedError) throw seedError;

      // Fetch questions again after seeding
      const { data, error: fetchError } = await supabase
        .from('vendor_questions')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('question_number');

      if (fetchError) throw fetchError;

      setQuestions(data || []);
    } catch (err) {
      console.error('Error seeding vendor questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to seed questions');
    }
  };

  const updateQuestion = async (questionNumber: number, questionText: string) => {
    if (!vendorId) return false;

    try {
      const { error } = await supabase
        .from('vendor_questions')
        .update({ question_text: questionText, updated_at: new Date().toISOString() })
        .eq('vendor_id', vendorId)
        .eq('question_number', questionNumber);

      if (error) throw error;

      // Update local state
      setQuestions(prev => 
        prev.map(q => 
          q.question_number === questionNumber 
            ? { ...q, question_text: questionText, updated_at: new Date().toISOString() }
            : q
        )
      );

      toast.success('Question updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating question:', err);
      toast.error('Failed to update question');
      return false;
    }
  };

  return {
    questions,
    loading,
    error,
    updateQuestion,
    refetch: fetchQuestions
  };
};