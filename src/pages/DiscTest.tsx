import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  text: string;
  options: {
    value: string;
    label: string;
    trait: 'D' | 'I' | 'S' | 'C';
  }[];
}

const discQuestions: Question[] = [
  {
    id: 1,
    text: "When making decisions, I tend to:",
    options: [
      { value: "a", label: "Act quickly and decisively", trait: "D" },
      { value: "b", label: "Consider how it affects people", trait: "I" },
      { value: "c", label: "Take time to analyze all options", trait: "C" },
      { value: "d", label: "Seek input from others first", trait: "S" }
    ]
  },
  {
    id: 2,
    text: "In social situations, I:",
    options: [
      { value: "a", label: "Take charge and lead conversations", trait: "D" },
      { value: "b", label: "Enjoy meeting new people and networking", trait: "I" },
      { value: "c", label: "Prefer smaller, intimate gatherings", trait: "S" },
      { value: "d", label: "Like to observe before participating", trait: "C" }
    ]
  },
  {
    id: 3,
    text: "When working on projects, I prefer to:",
    options: [
      { value: "a", label: "Set ambitious goals and push for results", trait: "D" },
      { value: "b", label: "Brainstorm creative ideas with others", trait: "I" },
      { value: "c", label: "Create detailed plans and follow them", trait: "C" },
      { value: "d", label: "Work steadily and maintain quality", trait: "S" }
    ]
  },
  {
    id: 4,
    text: "Under pressure, I typically:",
    options: [
      { value: "a", label: "Become more focused and determined", trait: "D" },
      { value: "b", label: "Rally others to work together", trait: "I" },
      { value: "c", label: "Analyze the situation thoroughly", trait: "C" },
      { value: "d", label: "Stay calm and support the team", trait: "S" }
    ]
  },
  {
    id: 5,
    text: "My communication style is usually:",
    options: [
      { value: "a", label: "Direct and to the point", trait: "D" },
      { value: "b", label: "Enthusiastic and expressive", trait: "I" },
      { value: "c", label: "Detailed and precise", trait: "C" },
      { value: "d", label: "Patient and supportive", trait: "S" }
    ]
  }
];

export default function DiscTest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<Record<'D' | 'I' | 'S' | 'C', number>>({ D: 0, I: 0, S: 0, C: 0 });

  const progress = ((currentQuestion + 1) / discQuestions.length) * 100;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < discQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const scores: Record<'D' | 'I' | 'S' | 'C', number> = { D: 0, I: 0, S: 0, C: 0 };
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = discQuestions.find(q => q.id === parseInt(questionId));
      const selectedOption = question?.options.find(opt => opt.value === answer);
      if (selectedOption) {
        scores[selectedOption.trait]++;
      }
    });

    setResults(scores);
    setIsComplete(true);
    saveResults(scores);
  };

  const saveResults = async (scores: Record<'D' | 'I' | 'S' | 'C', number>) => {
    if (!user) return;

    try {
      // Determine primary type (highest score)
      const primaryType = Object.entries(scores).reduce((a, b) => 
        scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
      )[0];

      const { error } = await supabase.functions.invoke('disc-complete', {
        body: {
          discType: primaryType,
          discScores: scores,
          discStatus: 'completed'
        }
      });

      if (error) {
        console.error('Error saving DISC results:', error);
        toast({
          title: "Warning",
          description: "Results calculated but couldn't save to your profile. You can retake the test if needed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "DISC Assessment Complete!",
          description: `Your primary type is ${primaryType}. Results have been saved to your profile.`
        });
      }
    } catch (error) {
      console.error('Error saving DISC results:', error);
    }
  };

  const getPrimaryType = () => {
    return Object.entries(results).reduce((a, b) => 
      results[a[0] as keyof typeof results] > results[b[0] as keyof typeof results] ? a : b
    )[0];
  };

  const getTypeDescription = (type: string) => {
    const descriptions = {
      D: "Dominant - You are direct, results-oriented, and enjoy taking charge.",
      I: "Influential - You are outgoing, enthusiastic, and people-focused.",
      S: "Steady - You are patient, reliable, and team-oriented.",
      C: "Conscientious - You are analytical, detail-oriented, and quality-focused."
    };
    return descriptions[type as keyof typeof descriptions] || "";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please sign in to take the DISC assessment.</p>
            <Button onClick={() => navigate('/auth')} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">DISC Assessment Complete!</CardTitle>
              <p className="text-muted-foreground">Your personality profile has been analyzed</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{getPrimaryType()}</div>
                <p className="text-lg">{getTypeDescription(getPrimaryType())}</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Your Scores:</h3>
                {Object.entries(results).map(([type, score]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium">{type}: {getTypeDescription(type).split(' - ')[0]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(score / discQuestions.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{score}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate('/agent-questionnaire')} className="flex-1">
                  Return to Questionnaire
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retake Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQ = discQuestions[currentQuestion];
  const hasAnswered = answers[currentQ.id] !== undefined;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handlePrevious} disabled={currentQuestion === 0}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} of {discQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">DISC Personality Assessment</CardTitle>
              <p className="text-lg font-medium">{currentQ.text}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
              >
                {currentQ.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={option.value} id={`${currentQ.id}-${option.value}`} />
                    <Label 
                      htmlFor={`${currentQ.id}-${option.value}`} 
                      className="flex-1 cursor-pointer text-sm leading-relaxed"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!hasAnswered}
                >
                  {currentQuestion === discQuestions.length - 1 ? 'Complete Assessment' : 'Next Question'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}