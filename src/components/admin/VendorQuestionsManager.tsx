import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Edit, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useVendorQuestions } from '@/hooks/useVendorQuestions';

interface Vendor {
  id: string;
  name: string;
  is_verified?: boolean;
}

export const VendorQuestionsManager = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [tempQuestionText, setTempQuestionText] = useState('');
  const [loading, setLoading] = useState(true);

  const { questions, loading: questionsLoading, updateQuestion, refetch } = useVendorQuestions(selectedVendor || undefined);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, is_verified')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Questions Manager</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage the 7 evaluation questions that appear on vendor profile cards
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="vendor-select">Select Vendor</Label>
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a vendor to manage their questions" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  <div className="flex items-center gap-2">
                    {vendor.name}
                    {vendor.is_verified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVendor && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Vendor Evaluation Questions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={questionsLoading}
              >
                Refresh
              </Button>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};