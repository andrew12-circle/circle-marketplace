import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import advisorScript from '../../data/advisor_script.json';

export interface Question {
  id: string;
  prompt: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  options?: string[];
  weight?: number;
  maps_to_signal: string;
}

export interface Section {
  title: string;
  questions: Question[];
}

export interface AdvisorScript {
  sections: Record<string, Section>;
  total_questions: number;
  estimated_time_minutes: number;
}

export interface AdvisorResponse {
  question_id: string;
  value: any;
}

export interface AdvisorSignal {
  signal: string;
  value: string;
  weight: number;
}

export const useAdvisorScript = () => {
  const [script] = useState<AdvisorScript>(advisorScript as AdvisorScript);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const getAllQuestions = (): Question[] => {
    return Object.values(script.sections).flatMap(section => section.questions);
  };

  const getSection = (sectionId: string): Section | undefined => {
    return script.sections[sectionId];
  };

  const getCurrentStep = (): number => {
    return Object.keys(responses).length;
  };

  const getTotalSteps = (): number => {
    return script.total_questions;
  };

  const isComplete = (): boolean => {
    return getCurrentStep() >= getTotalSteps();
  };

  const setResponse = async (questionId: string, value: any) => {
    const newResponses = { ...responses, [questionId]: value };
    setResponses(newResponses);
    
    // Store response in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('advisor_responses')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          value: { answer: value }
        }, {
          onConflict: 'user_id,question_id'
        });

      // Generate signals
      await generateSignals(newResponses);
    } catch (error) {
      console.error('Error storing response:', error);
    }
  };

  const generateSignals = async (currentResponses: Record<string, any>) => {
    const questions = getAllQuestions();
    const signals: AdvisorSignal[] = [];

    for (const question of questions) {
      const response = currentResponses[question.id];
      if (response !== undefined) {
        signals.push({
          signal: question.maps_to_signal,
          value: String(response),
          weight: question.weight || 1
        });
      }
    }

    // Store signals in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clear existing signals for this user
      await supabase
        .from('advisor_signals')
        .delete()
        .eq('user_id', user.id);

      // Insert new signals
      if (signals.length > 0) {
        await supabase
          .from('advisor_signals')
          .insert(
            signals.map(signal => ({
              user_id: user.id,
              signal: signal.signal,
              value: signal.value,
              weight: signal.weight
            }))
          );
      }
    } catch (error) {
      console.error('Error storing signals:', error);
    }
  };

  const loadSavedResponses = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: savedResponses } = await supabase
        .from('advisor_responses')
        .select('question_id, value')
        .eq('user_id', user.id);

      if (savedResponses) {
        const responseMap: Record<string, any> = {};
        savedResponses.forEach(response => {
          responseMap[response.question_id] = response.value.answer;
        });
        setResponses(responseMap);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('advisor_responses')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('advisor_signals')
        .delete()
        .eq('user_id', user.id);

      setResponses({});
    } catch (error) {
      console.error('Error resetting responses:', error);
    }
  };

  const getSignals = async (): Promise<AdvisorSignal[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: signals } = await supabase
        .from('advisor_signals')
        .select('signal, value, weight')
        .eq('user_id', user.id);

      return signals || [];
    } catch (error) {
      console.error('Error fetching signals:', error);
      return [];
    }
  };

  useEffect(() => {
    loadSavedResponses();
  }, []);

  return {
    script,
    responses,
    isLoading,
    getAllQuestions,
    getSection,
    getCurrentStep,
    getTotalSteps,
    isComplete,
    setResponse,
    loadSavedResponses,
    resetResponses,
    getSignals
  };
};