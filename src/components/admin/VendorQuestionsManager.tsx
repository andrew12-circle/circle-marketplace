import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Edit, X, Check, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useVendorQuestions } from '@/hooks/useVendorQuestions';

interface Vendor {
  id: string;
  name: string;
  is_verified?: boolean;
}

interface VendorQuestionsManagerProps {
  vendorId: string;
  vendorName: string;
}

export const VendorQuestionsManager = ({ vendorId, vendorName }: VendorQuestionsManagerProps) => {
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [tempQuestionText, setTempQuestionText] = useState('');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState<Set<number>>(new Set());
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});

  const { questions, loading: questionsLoading, updateQuestion, refetch } = useVendorQuestions(vendorId);

  // Initialize local answers when questions change
  useEffect(() => {
    const answers: Record<number, string> = {};
    questions.forEach(q => {
      answers[q.question_number] = q.answer_text || '';
    });
    setLocalAnswers(answers);
  }, [questions]);

  const handleEditClick = (questionNumber: number, currentText: string) => {
    setEditingQuestion(questionNumber);
    setTempQuestionText(currentText);
  };

  const handleSaveClick = async (questionNumber: number) => {
    const success = await updateQuestion(questionNumber, tempQuestionText);
    if (success) {
      setEditingQuestion(null);
      setTempQuestionText('');
    }
  };

  const handleCancelClick = () => {
    setEditingQuestion(null);
    setTempQuestionText('');
  };

  const generateAIQuestions = async () => {
    if (!vendorId) return;
    
    setGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-vendor-questions', {
        body: { vendorId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Generated AI answers for all 7 questions!`);
        // Refresh the questions to show the new AI-generated answers
        await refetch();
      } else {
        throw new Error(data?.error || 'Failed to generate AI answers');
      }
    } catch (err) {
      console.error('Error generating AI answers:', err);
      toast.error('Failed to generate AI answers');
    } finally {
      setGeneratingQuestions(false);
    }
  };


  const handleAnswerChange = useCallback(
    async (questionNumber: number, answerText: string) => {
      if (!vendorId) return;

      // Add to saving set
      setSavingAnswers(prev => new Set(prev).add(questionNumber));

      try {
        const { error } = await supabase
          .from('vendor_questions')
          .update({ 
            answer_text: answerText,
            manually_updated: true
          })
          .eq('vendor_id', vendorId)
          .eq('question_number', questionNumber);

        if (error) throw error;

      } catch (err) {
        console.error('Error saving answer:', err);
        toast.error('Failed to save answer');
        // Revert local state on error
        setLocalAnswers(prev => ({
          ...prev,
          [questionNumber]: questions.find(q => q.question_number === questionNumber)?.answer_text || ''
        }));
      } finally {
        // Remove from saving set
        setSavingAnswers(prev => {
          const newSet = new Set(prev);
          newSet.delete(questionNumber);
          return newSet;
        });
      }
    },
    [vendorId, questions]
  );

  // Debounced answer update
  const debouncedAnswerUpdate = useCallback(
    (questionNumber: number, answerText: string) => {
      const timeoutId = setTimeout(() => {
        handleAnswerChange(questionNumber, answerText);
      }, 1000); // Save after 1 second of no typing

      return () => clearTimeout(timeoutId);
    },
    [handleAnswerChange]
  );

  const handleLocalAnswerChange = (questionNumber: number, value: string) => {
    // Update local state immediately
    setLocalAnswers(prev => ({
      ...prev,
      [questionNumber]: value
    }));
    
    // Debounce the actual save
    debouncedAnswerUpdate(questionNumber, value);
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Vendor Questions & Answers</h3>
          <p className="text-sm text-muted-foreground">
            Manage the 7 evaluation questions for {vendorName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateAIQuestions}
            disabled={questionsLoading || generatingQuestions}
          >
            <Sparkles className={`h-4 w-4 mr-2 ${generatingQuestions ? 'animate-spin' : ''}`} />
            {generatingQuestions ? 'Generating...' : 'Generate AI Answers'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={questionsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${questionsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {questionsLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No questions found for this vendor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">
                        Question {question.question_number}
                      </Label>
                      {editingQuestion !== question.question_number ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(question.question_number, question.question_text)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveClick(question.question_number)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelClick}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {editingQuestion === question.question_number ? (
                      <Textarea
                        value={tempQuestionText}
                        onChange={(e) => setTempQuestionText(e.target.value)}
                        placeholder="Enter question text..."
                        className="min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                        {question.question_text}
                      </p>
                    )}
                    
                    {/* Answer Section */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-primary">Answer</Label>
                        {savingAnswers.has(question.question_number) && (
                          <span className="text-xs text-muted-foreground">Saving...</span>
                        )}
                      </div>
                      <Textarea
                        key={`answer-${question.id}`}
                        value={localAnswers[question.question_number] || ''}
                        onChange={(e) => {
                          handleLocalAnswerChange(question.question_number, e.target.value);
                        }}
                        placeholder="Enter the answer for this question..."
                        className="min-h-[100px] bg-background"
                      />
                      {question.ai_generated && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          AI Generated
                        </div>
                      )}
                      {question.manually_updated && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Edit className="h-3 w-3" />
                          Manually Updated
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
    </div>
  );
};